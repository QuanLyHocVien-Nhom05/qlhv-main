import {Injectable,ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {request} from 'node:https';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createWorker} from 'tesseract.js';
import {extractOcrText} from '../domain/ocr';
@Injectable()
export class ExternalAdapters{
 constructor(private readonly config:ConfigService){}
 status(){return {payment:!!this.config.get('VNPAY_TMN_CODE')&&!!this.config.get('VNPAY_HASH_SECRET'),momo:['MOMO_PARTNER_CODE','MOMO_ACCESS_KEY','MOMO_SECRET_KEY','MOMO_RETURN_URL','MOMO_IPN_URL'].every(k=>!!this.config.get(k)),bank:!!this.config.get('VNPAY_TMN_CODE')&&!!this.config.get('VNPAY_HASH_SECRET')&&!!this.config.get('VNPAY_RETURN_URL'),sms:!!this.config.get('SMS_ENDPOINT')&&!!this.config.get('SMS_TOKEN'),ocr:!!this.config.get('OCR_ENDPOINT')||existsSync(join(this.models(),'vie.traineddata')),erp:!!this.config.get('ERP_ENDPOINT')&&!!this.config.get('ERP_TOKEN'),signature:!!this.config.get('SIGNATURE_ENDPOINT')&&!!this.config.get('SIGNATURE_TOKEN')};}
 private models(){return resolve(this.config.get<string>('OCR_LANG_PATH')||join(process.cwd(),'storage','ocr'));}
 private async post(kind:string,data:unknown):Promise<any>{const address=this.config.get<string>(kind+'_ENDPOINT'),token=this.config.get<string>(kind+'_TOKEN');if(!address||!token)throw new ServiceUnavailableException('Dịch vụ '+kind+' đang chờ cấu hình.');const target=new URL(address);if(target.protocol!=='https:'||target.username||target.password)throw new ServiceUnavailableException('Dịch vụ tích hợp yêu cầu HTTPS.');const body=Buffer.from(JSON.stringify(data));
  return new Promise((resolve,reject)=>{const r=request(target,{method:'POST',minVersion:'TLSv1.3',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Content-Length':body.length},timeout:30000},res=>{const chunks:Buffer[]=[];let size=0;res.on('data',chunk=>{size+=chunk.length;if(size>24*1024*1024){r.destroy();reject(new Error('Oversize provider response'));}else chunks.push(chunk);});res.on('end',()=>{if((res.statusCode??500)<200||(res.statusCode??500)>=300){reject(new Error('Provider rejected request'));return;}try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(new Error('Invalid provider response'));}});});r.on('error',()=>reject(new Error('Không kết nối được dịch vụ tích hợp.')));r.on('timeout',()=>r.destroy());r.end(body);});
 }
 async ocr(buffer:Buffer,mime:string,type:string){
  if(this.config.get('OCR_ENDPOINT')){const value=await this.post('OCR',{mime,type,fileBase64:buffer.toString('base64')});return this.ocrFields(value);}
  let content='';if(mime==='application/pdf'){try{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const loading=pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:false});const doc=await loading.promise;try{for(let i=1;i<=Math.min(doc.numPages,10);i++){const text=await (await doc.getPage(i)).getTextContent();content+=text.items.map(item=>'str'in item?item.str+('hasEOL'in item&&item.hasEOL?'\n':' '):'').join('')+'\n';}}finally{await loading.destroy();}}catch{throw new ServiceUnavailableException('PDF cần OCR ngoài hoặc kiểm tra thủ công.');}}
  else {if(!existsSync(join(this.models(),'vie.traineddata'))||!existsSync(join(this.models(),'eng.traineddata')))throw new ServiceUnavailableException('Chưa có mô hình OCR cục bộ.');const worker=await createWorker(['vie','eng'],1,{langPath:this.models(),gzip:false,logger:()=>{},errorHandler:()=>{}});try{content=(await worker.recognize(buffer)).data.text;}finally{await worker.terminate();}}
  if(!content.trim())throw new ServiceUnavailableException('Tài liệu chưa có lớp chữ; cần OCR ngoài hoặc đối chiếu thủ công.');
  return this.ocrFields(extractOcrText(content));
 }
 private ocrFields(value:any){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid OCR response');return {HoTen:typeof value.HoTen==='string'?value.HoTen.slice(0,150):undefined,Diem:typeof value.Diem==='number'&&Number.isFinite(value.Diem)?value.Diem:undefined,NgaySinh:typeof value.NgaySinh==='string'?value.NgaySinh.slice(0,10):undefined,XepLoai:typeof value.XepLoai==='string'?value.XepLoai.slice(0,100):undefined,SoVanBang:typeof value.SoVanBang==='string'?value.SoVanBang.slice(0,100):undefined,NgayCap:typeof value.NgayCap==='string'?value.NgayCap.slice(0,10):undefined,TruongCap:typeof value.TruongCap==='string'?value.TruongCap.slice(0,250):undefined,Text:typeof value.Text==='string'?value.Text.slice(0,20000):undefined,CanKiemTra:value.CanKiemTra!==false};}
 async sms(phone:string,message:string){const result=await this.post('SMS',{phone,message});if(result.accepted!==true||!result.id)throw new Error('SMS has not been accepted');return result;}
 async erp(data:unknown){const result=await this.post('ERP',data);if(result.accepted!==true||!result.id)throw new Error('ERP has not acknowledged transfer');return result;}
 async sign(pdf:Buffer){const value=await this.post('SIGNATURE',{pdfBase64:pdf.toString('base64'),format:'PAdES'});if(typeof value.pdfBase64!=='string')throw new Error('Missing signed PDF');const result=Buffer.from(value.pdfBase64,'base64');if(result.length>15*1024*1024||result.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid signed PDF');return result;}
}
