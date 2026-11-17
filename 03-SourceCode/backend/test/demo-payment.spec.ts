import 'reflect-metadata';
import {describe,it,expect,vi} from 'vitest';
import {ConfigService} from '@nestjs/config';
import {DemoPaymentGateway,demoPaymentsEnabled} from '../src/modules/admissions/infrastructure/demo-payment.gateway';
import {PaymentGateway} from '../src/modules/admissions/infrastructure/payment.gateway';

const actor={sub:'21',roles:['APPLICANT']},config=new ConfigService({NODE_ENV:'test',DEMO_PAYMENTS_ENABLED:'true'});
const payment={MaGiaoDich:'MP-'+'a'.repeat(32),MaHoSo:7,LoaiPhi:'XET_TUYEN',SoTien:245000,Kenh:'MO_PHONG',TrangThai:'CHO_TT',LaMoPhong:true,HanThanhToan:new Date(Date.now()+900000),KetQuaMoPhong:null,MaBienLai:null};
function fixture(){return {get:vi.fn().mockResolvedValue({MaNguoi:21,TrangThai:'CHO_THANH_TOAN',LePhi:245000}),db:{query:vi.fn().mockResolvedValue({recordset:[payment]})}};}
describe('QR demo payment boundaries',()=>{
 it('requires an explicit flag and never allows the mode in production',()=>{
  for(const values of [{NODE_ENV:'production',DEMO_PAYMENTS_ENABLED:'true'},{NODE_ENV:'development',DEMO_PAYMENTS_ENABLED:'false'},{NODE_ENV:'staging',DEMO_PAYMENTS_ENABLED:'true'}])expect(demoPaymentsEnabled(new ConfigService(values))).toBe(false);
  expect(demoPaymentsEnabled(config)).toBe(true);
 });
 it('rejects disabled endpoints before reading applications or writing payments',async()=>{
  const service=fixture();
  for(const env of ['development','production']){
   const demo=new DemoPaymentGateway(service as any,new ConfigService({NODE_ENV:env,DEMO_PAYMENTS_ENABLED:env==='production'?'true':'false'}));
   await expect(demo.create(7,'XET_TUYEN',actor)).rejects.toThrow('chưa bật');
   await expect(demo.finish(7,payment.MaGiaoDich,'THANH_CONG',actor)).rejects.toThrow('chưa bật');
  }
  expect(service.get).not.toHaveBeenCalled();expect(service.db.query).not.toHaveBeenCalled();
 });
 it('does not allow another owner or staff to simulate a candidate payment',async()=>{
  const service=fixture(),demo=new DemoPaymentGateway(service as any,config);
  for(const other of [{sub:'22',roles:['APPLICANT']},{sub:'21',roles:['ACADEMIC_ADMIN']}])await expect(demo.create(7,'XET_TUYEN',other)).rejects.toThrow('Không tìm thấy');
  expect(service.db.query).not.toHaveBeenCalled();
 });
 it('uses the server fee and generates a real PNG QR without a bank redirect',async()=>{
  const service=fixture(),result=await new DemoPaymentGateway(service as any,config).create(7,'XET_TUYEN',actor);
  expect(service.db.query.mock.calls[0][1]).toMatchObject({Id:7,Actor:'21',Type:'XET_TUYEN',Amount:245000});
  expect(result.LaMoPhong).toBe(true);expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  expect(Buffer.from(result.qrDataUrl.split(',')[1],'base64').subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(result).not.toHaveProperty('url');
 });
 it('rejects tampered transaction codes and outcomes before writing',async()=>{
  const service=fixture(),demo=new DemoPaymentGateway(service as any,config);
  await expect(demo.finish(7,'GD-real','THANH_CONG',actor)).rejects.toThrow('không hợp lệ');
  await expect(demo.finish(7,payment.MaGiaoDich,'UNKNOWN' as any,actor)).rejects.toThrow('không hợp lệ');
  expect(service.db.query).not.toHaveBeenCalled();
 });
 it('keeps zero-fee waivers working without creating a fake transfer',async()=>{
  const service={get:vi.fn().mockResolvedValue({MaNguoi:21,TrangThai:'CHO_THANH_TOAN',LePhi:0}),db:{query:vi.fn().mockResolvedValue({recordset:[]})},audit:vi.fn()};
  const result=await new PaymentGateway(service as any,config).initiate(7,'XET_TUYEN',actor,'MO_PHONG');
  expect(result.message).toContain('miễn phí');expect(result).not.toHaveProperty('qrDataUrl');
  expect(service.db.query.mock.calls[0][1]).toMatchObject({Type:'XET_TUYEN'});
 });
});
