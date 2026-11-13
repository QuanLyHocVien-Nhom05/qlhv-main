import { describe, expect, it } from 'vitest';
import { registrationBlock, type Prerequisite, type StudyClass, type StudyProfile } from '../src/modules/studies/domain/study';
const profile:StudyProfile={MaHocVien:1,MaSoHocVien:'HV01',MaPhienBan:1,TenChuongTrinh:'Chương trình',TenNganh:'Ngành',KhoaTuyenSinh:'2026',TrinhDo:'THAC_SI',NgayNhapHoc:'2026-01-01',HanDaoTao:'2029-01-01',TrangThai:'DANG_HOC',TinChiToiThieu:60,TinChiTichLuy:0,DiemTrungBinh:null,DiemDatHocPhan:5,DiemTrungBinhToiThieu:5,NgayHienTai:'2026-11-08'};
const item:StudyClass={MaLopHocPhan:1,KyHieuLop:'L01',MaHocPhan:2,KyHieuHocPhan:'HP02',TenHocPhan:'Học phần',SoTinChi:3,NamHoc:'2026-2027',HocKy:1,GiangVien:'Giảng viên',SiSoToiDa:1,DaDangKy:0,DaTungDangKy:false,DangHocCungHocPhan:false,DiemTotNhat:null};
const prerequisite:Prerequisite={MaHocPhan:2,MaHocPhanTienQuyet:1,KyHieu:'HP01',TenHocPhan:'Tiên quyết',DiemTotNhat:null};
describe('Self-service class eligibility',()=>{
  it('accepts an eligible student and a spare seat',()=>expect(registrationBlock(profile,item,[])).toBeNull());
  it('blocks inactive, future and expired enrollment while including the last permitted day',()=>{
    for(const status of ['BAO_LUU','THOI_HOC','TOT_NGHIEP'])expect(registrationBlock({...profile,TrangThai:status},item,[])).toMatch(/trạng thái/);
    expect(registrationBlock({...profile,NgayNhapHoc:'2027-01-01'},item,[])).toMatch(/Chưa đến/);
    expect(registrationBlock({...profile,HanDaoTao:'2026-11-07'},item,[])).toMatch(/hết hạn/);
    expect(registrationBlock({...profile,HanDaoTao:profile.NgayHienTai},item,[])).toBeNull();
  });
  it('blocks missing or failed prerequisites and accepts the passing boundary',()=>{
    expect(registrationBlock(profile,item,[prerequisite])).toMatch(/HP01/);
    expect(registrationBlock(profile,item,[{...prerequisite,DiemTotNhat:4.99}])).toMatch(/HP01/);
    expect(registrationBlock(profile,item,[{...prerequisite,DiemTotNhat:5}])).toBeNull();
  });
  it('does not apply another course prerequisite to the selected class',()=>expect(registrationBlock(profile,item,[{...prerequisite,MaHocPhan:3}])).toBeNull());
  it('blocks full classes, prior registration and concurrent study of the same course',()=>{
    expect(registrationBlock(profile,{...item,DaDangKy:1},[])).toMatch(/sĩ số/);
    expect(registrationBlock(profile,{...item,DaTungDangKy:true},[])).toMatch(/đăng ký/);
    expect(registrationBlock(profile,{...item,DangHocCungHocPhan:true},[])).toMatch(/lớp khác/);
  });
  it('allows improvement in a different class after a completed course',()=>expect(registrationBlock(profile,{...item,DiemTotNhat:8},[])).toBeNull());
});
