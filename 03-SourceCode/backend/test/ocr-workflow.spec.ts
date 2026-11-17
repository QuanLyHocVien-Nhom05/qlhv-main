import {describe,it,expect,vi} from 'vitest';
import {AdmissionsService} from '../src/modules/admissions/application/admissions.service';
import {AdmissionJobs} from '../src/modules/admissions/infrastructure/admission-jobs.service';
import {documentTypes} from '../src/modules/admissions/domain/admission';
import {ConfigService} from '@nestjs/config';
import {extractOcrText} from '../src/modules/admissions/domain/ocr';

describe('OCR and screening coordination',()=>{
 it('tolerates accents and a single label error without correcting or inventing extracted values',()=>{
  const result=extractOcrText('Họ vò tên: Nguyễn Văn An\nNgay cdp: 01/06/2024\nTrường cdp bằng: Đại học Mẫu\nĐiểm: 9\nGPA: 3,5');
  expect(result).toMatchObject({HoTen:'Nguyễn Văn An',NgayCap:'2024-06-01',TruongCap:'Đại học Mẫu',Diem:3.5,CanKiemTra:true});
  expect(extractOcrText('Nội dung không có trường nhận diện').HoTen).toBeUndefined();
 });
 it('compares uncertain OCR results and keeps manual review when the certificate score differs',async()=>{
  const profile={HoTen:'Nguyễn Văn An',NgaySinh:'2000-03-02',NgayCapChungChi:'2026-10-01',DiemNgoaiNgu:7.5,Gpa:3.5,ThangGpa:4,XepLoai:'GIOI',TenChungChi:'IELTS',NganhTotNghiep:'CNTT',SoYeuLyLich:{}};
  const docs=documentTypes.filter(t=>t!=='DE_CUONG').map(type=>({LoaiTaiLieu:type,TrangThaiOcr:type==='CHUNG_CHI_NGOAI_NGU'?'CAN_KIEM_TRA':'HOAN_THANH',DuLieuOcrMaHoa:type==='CHUNG_CHI_NGOAI_NGU'?'ocr':null}));
  const query=vi.fn().mockResolvedValueOnce({recordset:[{Revision:Buffer.alloc(8),HoSoMaHoa:'profile',MaNguoi:1,MaChiTieu:1,TaiLieuBatBuoc:'[]',GpaToiThieu:5,NgayNop:'2026-11-01'}]}).mockResolvedValueOnce({recordset:docs}).mockResolvedValueOnce({recordset:[{DiemQuyDoi:7}]}).mockResolvedValueOnce({recordset:[{PhanLoai:'PHU_HOP'}]}).mockResolvedValueOnce({recordset:[{Version:'0x0000000000000001'}]});
  const service=new AdmissionsService({query} as any,{decode:(value:string)=>value==='profile'?profile:{Diem:6.5,CanKiemTra:true}} as any);
  const result=await service.preScreen(1);
  expect(result?.classification).toBe('CAN_KIEM_TRA');expect(result?.warnings).toContain('Sai lệch dữ liệu OCR: CHUNG_CHI_NGOAI_NGU');
 });
 it('screens after attaching a document that was already recognized',async()=>{
  const service=new AdmissionsService({query:vi.fn().mockResolvedValue({recordset:[]})} as any,{} as any);
  vi.spyOn(service,'get').mockResolvedValue({} as any);vi.spyOn(service,'audit').mockResolvedValue(undefined);const screen=vi.spyOn(service,'preScreen').mockResolvedValue(undefined);
  await service.attach(4,9,{sub:'1',roles:['APPLICANT']});expect(screen).toHaveBeenCalledWith(4);
 });
 it('uses the current document association when attachment occurs during recognition',async()=>{
  const query=vi.fn().mockResolvedValueOnce({recordset:[{MaTaiLieu:9,MaHoSo:null,KhoaLuuTru:'file',LoaiNoiDung:'image/png',LoaiTaiLieu:'BANG_DIEM'}]}).mockResolvedValueOnce({recordset:[]}).mockResolvedValueOnce({recordset:[{MaHoSo:4}]}),preScreen=vi.fn();
  const jobs=new AdmissionJobs({db:{query},crypto:{encode:()=> 'encrypted'},preScreen} as any,{read:async()=>Buffer.from('image')} as any,{ocr:async()=>({CanKiemTra:true,Diem:3.5})} as any,{} as any,new ConfigService());
  await jobs.processOcr();expect(preScreen).toHaveBeenCalledWith(4);expect(query.mock.calls[1][1]).toMatchObject({State:'CAN_KIEM_TRA'});
 });
});
