import 'reflect-metadata';
import { describe,it,expect,vi } from 'vitest';
import { validateFields,ref,num,date,datetime,text } from '../src/modules/management/domain/resource';
import { SqlProgramService } from '../src/modules/programs/application/sql-program.service';
describe('HTTP input business validation',()=>{
 it('preserves UTC meeting times and the legacy date-only contract',()=>{const fields=[datetime('NgayHop','Ngày giờ họp')];expect(validateFields(fields,{NgayHop:'2026-11-09T02:30:00Z'}).NgayHop).toBe('2026-11-09T02:30:00');expect(validateFields(fields,{NgayHop:'2026-11-09'}).NgayHop).toBe('2026-11-09T00:00:00');});
 it('rejects impossible dates and meeting times without an explicit UTC zone',()=>{for(const value of ['2026-02-30T02:30:00Z','2026-11-09T24:00:00Z','2026-11-09T09:30','0000-01-01T00:00:00Z'])expect(()=>validateFields([datetime('NgayHop','Ngày giờ họp')],{NgayHop:value})).toThrow();});
  it('accepts seeded string category keys and normalizes empty optional text',()=>{
    expect(validateFields([ref('MaLoaiMoc','Loại mốc','milestone-types'),text('GhiChu','Ghi chú',100,false)],{MaLoaiMoc:'BAO_VE',GhiChu:'  '})).toEqual({MaLoaiMoc:'BAO_VE',GhiChu:null});
  });
  it('rejects non-finite/fractional IDs, impossible dates and unknown fields',()=>{
    expect(()=>validateFields([ref('Id','Mã','students')],{Id:1.5})).toThrow();
    expect(()=>validateFields([num('Tien','Số tiền',1)],{Tien:Infinity})).toThrow();
    expect(()=>validateFields([date('Ngay','Ngày')],{Ngay:'2026-02-30'})).toThrow();
    expect(()=>validateFields([text('Ten','Tên')],{Ten:'A',Sql:'DROP'})).toThrow();
  });
  it('rejects duplicate curriculum courses before calling the SQL adapter',()=>{
    const repository={create:vi.fn()};const service=new SqlProgramService(repository as any);
    const course={MaHocPhan:1,SoTinChi:3,HocKyDuKien:1,BatBuoc:true,TienQuyet:[]};
    expect(()=>service.create({KyHieu:'TEST',TenChuongTrinh:'Test',MaNganh:1,TrinhDo:'THAC_SI',PhienBan:{KhoaTuyenSinh:'2026',TinChiToiThieu:6,DiemDatHocPhan:5,DiemTrungBinhToiThieu:5,ThoiGianToiDaThang:24,HocPhan:[course,course]}},'1')).toThrow(/trùng/);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
