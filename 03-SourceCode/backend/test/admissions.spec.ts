import {describe,it,expect,vi} from 'vitest';
import {ConfigService} from '@nestjs/config';
import {DataProtection} from '../src/shared/security/data-protection';
import {calculateScores,rankCandidates,reviewReason,validateProfile} from '../src/modules/admissions/domain/admission';
import {paymentSignature} from '../src/modules/admissions/infrastructure/payment.gateway';
import {AdmissionsService} from '../src/modules/admissions/application/admissions.service';
import {SqlServerService} from '../src/shared/infrastructure/sql-server.service';
describe('Admissions data and decision invariants',()=>{
 it('uses randomized authenticated encryption bound to its record context',()=>{
  const vault=new DataProtection(new ConfigService({DATA_ENCRYPTION_KEY:'ab'.repeat(32)}));
  const value={SoGiayTo:'123456789012',HoTen:'Test applicant'},a=vault.encode(value,'profile:1'),b=vault.encode(value,'profile:1');
  expect(a).not.toBe(b);expect(a).not.toContain(value.SoGiayTo);expect(vault.decode(a,'profile:1')).toEqual(value);
  expect(()=>vault.decode(a,'profile:2')).toThrow();const tampered=Buffer.from(a,'base64');tampered[29]^=1;expect(()=>vault.decode(tampered.toString('base64'),'profile:1')).toThrow();
  expect(()=>new DataProtection(new ConfigService()).encode(value,'profile:1')).toThrow();expect(vault.identity('ab123456')).toBe(vault.identity('AB123456'));
 });
 it('rejects invalid GPA and calendar dates before encrypting a profile',()=>{
  const p={HoTen:'Applicant',NgaySinh:'2000-01-01',SoGiayTo:'123456789012',DienThoai:'0901234567',TruongCapBang:'University',NganhTotNghiep:'IT',XepLoai:'GIOI',Gpa:3.5,ThangGpa:4,NoiCongTac:'',DoiTuongUuTien:'',TenChungChi:'IELTS',DiemNgoaiNgu:6.5,NgayCapChungChi:'2026-01-01',TenDeCuong:''};
  expect(validateProfile({...p}).Gpa).toBe(3.5);expect(()=>validateProfile({...p,Gpa:5})).toThrow();expect(()=>validateProfile({...p,NgaySinh:'2000-02-30'})).toThrow();expect(()=>validateProfile({...p,role:'ADMIN'})).toThrow();
  for(const invalid of [{Gpa:NaN},{Gpa:Infinity},{DiemNgoaiNgu:NaN},{DiemNgoaiNgu:Infinity},{ThangGpa:'4'},{XepLoai:'TU_KHAI'}])expect(()=>validateProfile({...p,...invalid})).toThrow();
 });
 it('requires a standard supplement reason and preserves the specific instructions',()=>{
  expect(reviewReason('CAN_BO_SUNG','TAI_LIEU_MO','Tải lại bảng điểm rõ nét.')).toBe('Tài liệu bị mờ hoặc không đọc được: Tải lại bảng điểm rõ nét.');
  expect(()=>reviewReason('CAN_BO_SUNG',undefined,'Tải lại bảng điểm.')).toThrow();
  expect(()=>reviewReason('CAN_BO_SUNG','UNKNOWN','Tải lại bảng điểm.')).toThrow();
  expect(()=>reviewReason('CAN_BO_SUNG','TAI_LIEU_MO',' '.repeat(10))).toThrow();
  expect(()=>reviewReason('CAN_BO_SUNG','TAI_LIEU_MO','x'.repeat(2000))).toThrow();
  expect(reviewReason('DU_DIEU_KIEN',undefined,'Đã đối chiếu đầy đủ.')).toBe('Đã đối chiếu đầy đủ.');
 });
 it('rejects a locked submission before screening can change its version',async()=>{
  const query=vi.fn(),service=new AdmissionsService({query} as unknown as SqlServerService,{} as DataProtection);
  vi.spyOn(service,'get').mockResolvedValue({TrangThai:'DU_DIEU_KIEN'} as any);
  const screen=vi.spyOn(service,'preScreen');
  await expect(service.submit(1,'0x0000000000000001',{sub:'1',roles:['APPLICANT']})).rejects.toThrow('khóa');
  expect(screen).not.toHaveBeenCalled();expect(query).not.toHaveBeenCalled();
 });
 it('blocks missing evidence even if another screening rule classifies the profile as ineligible',async()=>{
  const query=vi.fn(),service=new AdmissionsService({query} as unknown as SqlServerService,{} as DataProtection);
  vi.spyOn(service,'get').mockResolvedValue({TrangThai:'NHAP',TrangThaiDot:'DANG_MO',MoHoSo:new Date(Date.now()-60000),DongHoSo:new Date(Date.now()+60000),Version:'0x0000000000000001'} as any);
  vi.spyOn(service,'preScreen').mockResolvedValue({classification:'KHONG_DAT',warnings:[],missing:['BANG_DIEM'],Version:'0x0000000000000002'});
  await expect(service.submit(1,'0x0000000000000001',{sub:'1',roles:['APPLICANT']})).rejects.toThrow('đủ tài liệu');
  expect(query).not.toHaveBeenCalled();
 });
 it('applies configured weights, the score floor and quota; stops fully tied boundaries',()=>{
  const rule={HeSoCoSo:1,HeSoChuyenNganh:2,HeSoNgoaiNgu:1,HeSoUuTien:1};
  const scores=calculateScores({CoSo:7,ChuyenNganh:8,NgoaiNgu:6,UuTien:1},rule,8);expect(scores.Tong).toBe(30);
  const rows=[{MaHoSo:1,SoHoSo:'A',scores},{MaHoSo:2,SoHoSo:'B',scores:{...scores,Gpa:7}}];expect(rankCandidates(rows,'GPA',1,29).map(r=>r.selected)).toEqual([true,false]);expect(rankCandidates(rows,'GPA',1,31).every(r=>!r.selected)).toBe(true);
  expect(()=>rankCandidates(rows.map(r=>({...r,scores})),'GPA',1,29)).toThrow();expect(()=>calculateScores({CoSo:11,ChuyenNganh:8,NgoaiNgu:6,UuTien:0},rule,8)).toThrow();
 });
 it('signs canonical sorted gateway fields and detects amount changes',()=>{
  const a={vnp_Amount:'10000',vnp_TxnRef:'ABC',vnp_OrderInfo:'Le phi tuyen sinh'};
  expect(paymentSignature(a,'test')).toBe(paymentSignature({vnp_OrderInfo:a.vnp_OrderInfo,vnp_TxnRef:'ABC',vnp_Amount:'10000'},'test'));
  expect(paymentSignature(a,'test')).not.toBe(paymentSignature({...a,vnp_Amount:'20000'},'test'));
 });
});
