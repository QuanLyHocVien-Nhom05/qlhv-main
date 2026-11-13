export type StudentProfile={
  MaHocVien:number;MaSoHocVien:string;MaPhienBan:number;TenChuongTrinh:string;TenNganh:string;KhoaTuyenSinh:string;TrinhDo:string;
  NgayNhapHoc:string;HanDaoTao:string;TrangThai:string;TinChiToiThieu:number;TinChiTichLuy:number;DiemTrungBinh:number|null;
  DiemDatHocPhan:number;DiemTrungBinhToiThieu:number;NgayHienTai:string;
};
export type StudyCourse={MaHocPhan:number;KyHieu:string;TenHocPhan:string;SoTinChi:number;HocKyDuKien:number;BatBuoc:boolean;DiemTotNhat:number|null};
export type StudyPrerequisite={MaHocPhan:number;MaHocPhanTienQuyet:number;KyHieu:string;TenHocPhan:string;DiemTotNhat:number|null};
export type StudyClass={MaLopHocPhan:number;KyHieuLop:string;MaHocPhan:number;KyHieuHocPhan:string;TenHocPhan:string;SoTinChi:number;NamHoc:string;HocKy:number;GiangVien:string;SiSoToiDa:number;DaDangKy:number;DiemTotNhat:number|null;LyDoKhongTheDangKy:string|null};
export type StudyRegistration={MaDangKy:number;MaLopHocPhan:number;KyHieuLop:string;KyHieuHocPhan:string;TenHocPhan:string;SoTinChi:number;NamHoc:string;HocKy:number;NgayDangKy:string;TrangThai:string;DaKhoaDiem:boolean;DiemTongKet:number|null};
export type StudyDetail={HocVien:StudentProfile;HocPhan:StudyCourse[];TienQuyet:StudyPrerequisite[];LopHocPhan:StudyClass[];DangKy:StudyRegistration[]};
