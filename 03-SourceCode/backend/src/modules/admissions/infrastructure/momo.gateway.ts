import {BadRequestException,ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {request} from 'node:https';
import type {AdmissionsService,AdmissionActor} from '../application/admissions.service';

// Field order and raw (not URL-encoded) values follow MoMo captureWallet v2.
export const momoCreateKeys=['accessKey','amount','extraData','ipnUrl','orderId','orderInfo','partnerCode','redirectUrl','requestId','requestType'];
export const momoCallbackKeys=['accessKey','amount','extraData','message','orderId','orderInfo','orderType','partnerCode','payType','requestId','responseTime','resultCode','transId'];
export function momoSignature(data:Record<string,unknown>,keys:string[],secret:string){return createHmac('sha256',secret).update(keys.map(k=>`${k}=${data[k]??''}`).join('&')).digest('hex');}
function equalSignature(value:unknown,expected:string){return typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value)&&timingSafeEqual(Buffer.from(value,'hex'),Buffer.from(expected,'hex'));}
export async function momoPost(url:URL,data:unknown):Promise<any>{
 const body=Buffer.from(JSON.stringify(data));
 return new Promise((resolve,reject)=>{const req=request(url,{method:'POST',minVersion:'TLSv1.3',timeout:30000,headers:{'Content-Type':'application/json','Content-Length':body.length}},res=>{
  const chunks:Buffer[]=[];let size=0;res.on('data',b=>{size+=b.length;if(size>1024*1024)req.destroy(new Error('Provider response too large'));else chunks.push(b);});res.on('error',reject);res.on('end',()=>{if((res.statusCode??500)<200||(res.statusCode??500)>=300)return reject(new Error('Provider rejected request'));try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(new Error('Invalid provider response'));}});
 });req.on('timeout',()=>req.destroy(new Error('Provider timeout')));req.on('error',reject);req.end(body);});
}
export class MomoGateway{
 constructor(private readonly service:AdmissionsService,private readonly config:ConfigService,private readonly send=momoPost){}
 private settings(){const partnerCode=this.config.get<string>('MOMO_PARTNER_CODE'),accessKey=this.config.get<string>('MOMO_ACCESS_KEY'),secret=this.config.get<string>('MOMO_SECRET_KEY');if(!partnerCode||!accessKey||!secret)throw new ServiceUnavailableException('MoMo đang chờ cấu hình; chưa ghi nhận thanh toán.');return {partnerCode,accessKey,secret};}
 async create(id:number,type:string,amount:number,code:string,actor:AdmissionActor){
  const {partnerCode,accessKey,secret}=this.settings();if(!Number.isSafeInteger(amount)||amount<1000||amount>50000000)throw new BadRequestException('MoMo hỗ trợ từ 1.000 đến 50.000.000 VND.');
  let url:URL,redirect:URL,ipn:URL;try{url=new URL(this.config.get('MOMO_URL','https://test-payment.momo.vn/v2/gateway/api/create'));redirect=new URL(this.config.getOrThrow('MOMO_RETURN_URL'));ipn=new URL(this.config.getOrThrow('MOMO_IPN_URL'));}catch{throw new ServiceUnavailableException('Cần cấu hình URL thanh toán, trả về và IPN MoMo.');}
  if([url,redirect,ipn].some(u=>u.protocol!=='https:'||!!u.username||!!u.password))throw new ServiceUnavailableException('MoMo yêu cầu các URL HTTPS.');
  const payload={partnerCode,requestId:code,orderId:code,amount,orderInfo:'Le phi tuyen sinh '+id,requestType:'captureWallet',ipnUrl:ipn.href,redirectUrl:redirect.href,extraData:'',autoCapture:true,lang:'vi'};
  const signature=momoSignature({...payload,accessKey},momoCreateKeys,secret);
  await this.service.db.query(`INSERT tuyen_sinh.GiaoDich(MaGiaoDich,MaHoSo,LoaiPhi,SoTien,Kenh) VALUES(@Code,@Id,@Type,@Amount,'MOMO')`,{Code:code,Id:id,Type:type,Amount:amount});
  let response:any;try{response=await this.send(url,{...payload,signature});}catch{throw new ServiceUnavailableException('Chưa nhận phản hồi MoMo. Giao dịch vẫn chờ xác nhận từ IPN.');}
  if(response?.resultCode!==0||response.partnerCode!==partnerCode||response.orderId!==code||response.requestId!==code||Number(response.amount)!==amount||typeof response.payUrl!=='string')throw new ServiceUnavailableException('MoMo chưa chấp nhận tạo thanh toán.');
  let target:URL;try{target=new URL(response.payUrl);}catch{throw new ServiceUnavailableException('URL trả về từ MoMo không hợp lệ.');}if(target.protocol!=='https:'||target.username||target.password||!['test-payment.momo.vn','payment.momo.vn'].includes(target.hostname))throw new ServiceUnavailableException('URL thanh toán MoMo không hợp lệ.');
  await this.service.audit(actor,'TAO_GIAO_DICH_MOMO',id,{MaGiaoDich:code});return {MaGiaoDich:code,url:target.href};
 }
 async callback(data:Record<string,unknown>){
  const {partnerCode,accessKey,secret}=this.settings();
  if(!data||typeof data!=='object'||momoCallbackKeys.filter(k=>k!=='accessKey').some(k=>!['string','number'].includes(typeof data[k])||String(data[k]).length>2000)||data.partnerCode!==partnerCode||!equalSignature(data.signature,momoSignature({...data,accessKey},momoCallbackKeys,secret)))throw new BadRequestException('Chữ ký MoMo không hợp lệ.');
  if(!Number.isSafeInteger(data.amount)||Number(data.amount)<1||!Number.isSafeInteger(data.resultCode)||data.requestId!==data.orderId||!/^\d+$/.test(String(data.transId))||!Number.isSafeInteger(Number(data.transId)))throw new BadRequestException('Dữ liệu MoMo không hợp lệ.');
  const payment=(await this.service.db.query<any>(`SELECT * FROM tuyen_sinh.GiaoDich WHERE MaGiaoDich=@Code AND Kenh='MOMO'`,{Code:data.orderId})).recordset[0];
  if(!payment||Number(payment.SoTien)!==data.amount)throw new BadRequestException('MoMo không khớp giao dịch hoặc số tiền.');
  if(payment.TrangThai==='DA_TT')return;
  // MoMo result 9000 is authorization only, never a captured payment.
  if(data.resultCode===9000)return;
  await this.service.db.query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;UPDATE tuyen_sinh.GiaoDich SET TrangThai=@State,MaNhaCungCap=CASE WHEN @State='DA_TT' THEN @Provider ELSE NULL END,MaBienLai=CASE WHEN @State='DA_TT' THEN @Receipt ELSE NULL END,NgayThanhToan=CASE WHEN @State='DA_TT' THEN SYSUTCDATETIME() ELSE NULL END WHERE MaGiaoDich=@Code AND Kenh='MOMO' AND TrangThai='CHO_TT';IF @@ROWCOUNT=1 AND @State='DA_TT' AND @Type='XET_TUYEN' UPDATE tuyen_sinh.HoSo SET TrangThai='DA_NOP' WHERE MaHoSo=@Id AND TrangThai='CHO_THANH_TOAN';COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Code:data.orderId,Id:payment.MaHoSo,Type:payment.LoaiPhi,State:data.resultCode===0?'DA_TT':'THAT_BAI',Provider:'MOMO-'+data.transId,Receipt:'BL-'+payment.MaGiaoDich});
 }
}
