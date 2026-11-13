import {describe,it,expect,vi} from 'vitest';
import {createHmac} from 'node:crypto';
import {ConfigService} from '@nestjs/config';
import {extractOcrText} from '../src/modules/admissions/domain/ocr';
import {MomoGateway,momoSignature,momoCallbackKeys,momoCreateKeys} from '../src/modules/admissions/infrastructure/momo.gateway';
import {PaymentGateway} from '../src/modules/admissions/infrastructure/payment.gateway';
import {reportColumns} from '../src/modules/admissions/domain/report';

const config=new ConfigService({MOMO_PARTNER_CODE:'TEST_PARTNER',MOMO_ACCESS_KEY:'test-access',MOMO_SECRET_KEY:'test-secret',MOMO_RETURN_URL:'https://university.invalid/tuyen-sinh',MOMO_IPN_URL:'https://university.invalid/api/integrations/momo/ipn'});
const notification={partnerCode:'TEST_PARTNER',orderId:'GD-test',requestId:'GD-test',amount:12345,extraData:'',message:'Successful.',orderInfo:'Le phi',orderType:'momo_wallet',payType:'qr',responseTime:1700000000000,resultCode:0,transId:12345678};
const sign=(data:Record<string,unknown>)=>({...data,signature:momoSignature({...data,accessKey:'test-access'},momoCallbackKeys,'test-secret')});
describe('Admissions completion and provider contracts',()=>{
 it('accepts ordered report headings and rejects unknown, duplicate or executable field definitions',()=>{
  expect(reportColumns('[{"key":"HoTen","title":" Tên thí sinh "},{"key":"SoHoSo","title":"Mã hồ sơ"}]')).toEqual([['HoTen','Tên thí sinh'],['SoHoSo','Mã hồ sơ']]);
  for(const input of ['[]','{}','not-json','[{"key":"MatKhauBam","title":"Secret"}]','[{"key":"HoTen","title":"A"},{"key":"HoTen","title":"B"}]','[{"key":"HoTen","title":"A","sql":"SELECT *"}]'])expect(()=>reportColumns(input)).toThrow();
 });
 it('extracts the required OCR fields while retaining manual review for unmeasured local OCR',()=>{
  const result=extractOcrText('Họ và tên: Nguyễn Văn An\nNgày sinh: 2/3/2000\nSố hiệu văn bằng: ABC-123\nNgày cấp: 01/10/2026\nTrường cấp bằng: Đại học A\nGPA: 3,5\nXếp loại: Giỏi');
  expect(result).toMatchObject({HoTen:'Nguyễn Văn An',NgaySinh:'2000-03-02',SoVanBang:'ABC-123',NgayCap:'2026-10-01',TruongCap:'Đại học A',Diem:3.5,XepLoai:'Giỏi',CanKiemTra:true});
  expect(extractOcrText('Ngày sinh: 30/02/2000').NgaySinh).toBeUndefined();
 });
 it('signs MoMo raw values in the documented order without URL encoding',()=>{
  const data={accessKey:'A',amount:12345,extraData:'',ipnUrl:'https://x.invalid/ipn',orderId:'O',orderInfo:'Lệ phí A & B',partnerCode:'P',redirectUrl:'https://x.invalid/return',requestId:'R',requestType:'captureWallet'};
  const raw='accessKey=A&amount=12345&extraData=&ipnUrl=https://x.invalid/ipn&orderId=O&orderInfo=Lệ phí A & B&partnerCode=P&redirectUrl=https://x.invalid/return&requestId=R&requestType=captureWallet';
  expect(momoSignature(data,momoCreateKeys,'secret')).toBe(createHmac('sha256','secret').update(raw).digest('hex'));
 });
 it('never creates a payment or calls a provider without configuration',async()=>{
  const service={db:{query:vi.fn()},audit:vi.fn()},send=vi.fn();
  await expect(new MomoGateway(service as any,new ConfigService(),send).create(1,'XET_TUYEN',10000,'GD-test',{sub:'1',roles:['APPLICANT']})).rejects.toThrow('cấu hình');
  expect(service.db.query).not.toHaveBeenCalled();expect(send).not.toHaveBeenCalled();
 });
 it('creates a signed pending MoMo order and does not mark it paid from the redirect response',async()=>{
  const service={db:{query:vi.fn().mockResolvedValue({recordset:[]})},audit:vi.fn()},send=vi.fn().mockResolvedValue({resultCode:0,partnerCode:'TEST_PARTNER',orderId:'GD-test',requestId:'GD-test',amount:12345,payUrl:'https://test-payment.momo.vn/pay?test=1'});
  await expect(new MomoGateway(service as any,config,send).create(1,'XET_TUYEN',12345,'GD-test',{sub:'1',roles:['APPLICANT']})).resolves.toMatchObject({MaGiaoDich:'GD-test'});
  const sent=send.mock.calls[0][1];expect(sent.signature).toBe(momoSignature({...sent,accessKey:'test-access'},momoCreateKeys,'test-secret'));expect(service.db.query.mock.calls).toHaveLength(1);expect(service.db.query.mock.calls[0][0]).not.toContain("'DA_TT'");
 });
 it('rejects forged notifications before querying and mismatched amounts before committing',async()=>{
  const query=vi.fn().mockResolvedValue({recordset:[{MaGiaoDich:'GD-test',MaHoSo:1,SoTien:12345,LoaiPhi:'XET_TUYEN',TrangThai:'CHO_TT'}]}),gateway=new MomoGateway({db:{query}} as any,config);
  await expect(gateway.callback({...notification,signature:'0'.repeat(64)})).rejects.toThrow('Chữ ký');expect(query).not.toHaveBeenCalled();
  await expect(gateway.callback(sign({...notification,amount:20000}))).rejects.toThrow('số tiền');expect(query).toHaveBeenCalledTimes(1);
 });
 it('does not count an authorization as captured payment and safely acknowledges repeated paid callbacks',async()=>{
  const query=vi.fn().mockResolvedValue({recordset:[{MaGiaoDich:'GD-test',MaHoSo:1,SoTien:12345,LoaiPhi:'XET_TUYEN',TrangThai:'CHO_TT'}]}),gateway=new MomoGateway({db:{query}} as any,config);
  await gateway.callback(sign({...notification,resultCode:9000}));expect(query).toHaveBeenCalledTimes(1);
  query.mockClear();await gateway.callback(sign(notification));expect(query).toHaveBeenCalledTimes(2);expect(query.mock.calls[1][1]).toMatchObject({State:'DA_TT',Provider:'MOMO-12345678'});
  query.mockClear().mockResolvedValue({recordset:[{SoTien:12345,TrangThai:'DA_TT'}]});await gateway.callback(sign(notification));expect(query).toHaveBeenCalledTimes(1);
 });
 it('selects domestic bank payments through the signed VNPAY bank selector',async()=>{
  const service={get:vi.fn().mockResolvedValue({MaNguoi:'1',TrangThai:'CHO_THANH_TOAN',LePhi:10000}),db:{query:vi.fn().mockResolvedValue({recordset:[]})}},gateway=new PaymentGateway(service as any,new ConfigService({VNPAY_TMN_CODE:'test',VNPAY_HASH_SECRET:'test-secret',VNPAY_RETURN_URL:'https://university.invalid/tuyen-sinh'}));
  const result=await gateway.initiate(1,'XET_TUYEN',{sub:'1',roles:['APPLICANT']},'NGAN_HANG');expect(new URL(result.url!).searchParams.get('vnp_BankCode')).toBe('VNBANK');
 });
});
