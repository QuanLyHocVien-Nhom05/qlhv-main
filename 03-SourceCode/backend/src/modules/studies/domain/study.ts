export interface StudyProfile {
  MaHocVien:number; MaSoHocVien:string; MaPhienBan:number; TenChuongTrinh:string; TenNganh:string;
  KhoaTuyenSinh:string; TrinhDo:string; NgayNhapHoc:string; HanDaoTao:string; TrangThai:string;
  TinChiToiThieu:number; TinChiTichLuy:number; DiemTrungBinh:number|null; DiemDatHocPhan:number;
  DiemTrungBinhToiThieu:number; NgayHienTai:string;
}
export interface Prerequisite {
  MaHocPhan:number; MaHocPhanTienQuyet:number; KyHieu:string; TenHocPhan:string; DiemTotNhat:number|null;
}
export interface StudyClass {
  MaLopHocPhan:number; KyHieuLop:string; MaHocPhan:number; KyHieuHocPhan:string; TenHocPhan:string;
  SoTinChi:number; NamHoc:string; HocKy:number; GiangVien:string; SiSoToiDa:number; DaDangKy:number;
  DaTungDangKy:boolean; DangHocCungHocPhan:boolean; DiemTotNhat:number|null;
}
export function registrationBlock(profile:StudyProfile, item:StudyClass, prerequisites:Prerequisite[]):string|null {
  if(profile.TrangThai!=='DANG_HOC')return 'Hồ sơ học viên không ở trạng thái đang học.';
  if(profile.NgayNhapHoc>profile.NgayHienTai)return 'Chưa đến ngày nhập học.';
  if(profile.HanDaoTao<profile.NgayHienTai)return 'Đã hết hạn đào tạo. Vui lòng liên hệ giáo vụ.';
  if(item.DaTungDangKy)return 'Bạn đã có đăng ký ở lớp này.';
  if(item.DangHocCungHocPhan)return 'Bạn đang học học phần này ở một lớp khác.';
  const missing=prerequisites.filter(p=>p.MaHocPhan===item.MaHocPhan&&(p.DiemTotNhat===null||p.DiemTotNhat<profile.DiemDatHocPhan));
  if(missing.length)return `Chưa đạt tiên quyết: ${missing.map(p=>p.KyHieu).join(', ')}.`;
  if(item.DaDangKy>=item.SiSoToiDa)return 'Lớp đã đủ sĩ số.';
  return null;
}
