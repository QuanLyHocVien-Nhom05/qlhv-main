SET XACT_ABORT ON;SET QUOTED_IDENTIFIER ON;
GO
DECLARE @Lenh nvarchar(max)=N'';
SELECT @Lenh+=N'ALTER TABLE he_thong.TaiKhoanDangNhap DROP CONSTRAINT '+QUOTENAME(name)+N';' FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('he_thong.TaiKhoanDangNhap') AND definition LIKE '%VaiTro%';
IF @Lenh<>N'' EXEC(@Lenh);
ALTER TABLE he_thong.TaiKhoanDangNhap WITH CHECK ADD CONSTRAINT CK_TaiKhoan_VaiTro CHECK(VaiTro IN('ADMIN','LANH_DAO','CAN_BO','GIANG_VIEN','USER','THI_SINH'));
IF COL_LENGTH('danh_muc.DonVi','MaDonViCha') IS NULL BEGIN
 ALTER TABLE danh_muc.DonVi ADD MaDonViCha int NULL REFERENCES danh_muc.DonVi(MaDonVi),LoaiDonVi varchar(20) NOT NULL DEFAULT 'KHOA',DangHoatDong bit NOT NULL DEFAULT 1,PhienBanDuLieu rowversion;
END;
IF COL_LENGTH('danh_muc.Nganh','DangHoatDong') IS NULL ALTER TABLE danh_muc.Nganh ADD DangHoatDong bit NOT NULL DEFAULT 1,PhienBanDuLieu rowversion;
IF COL_LENGTH('hoc_thuat.HocPhan','TenTiengAnh') IS NULL ALTER TABLE hoc_thuat.HocPhan ADD TenTiengAnh nvarchar(250) NULL,MaDonVi int NULL REFERENCES danh_muc.DonVi(MaDonVi),SoTinChiMacDinh tinyint NULL CHECK(SoTinChiMacDinh BETWEEN 1 AND 30),TrangThai varchar(20) NOT NULL DEFAULT 'DANG_SU_DUNG' CHECK(TrangThai IN('DANG_SU_DUNG','NGUNG_SU_DUNG')),PhienBanDuLieu rowversion;
IF COL_LENGTH('he_thong.NhatKyThayDoi','DiaChiIP') IS NULL ALTER TABLE he_thong.NhatKyThayDoi ADD DiaChiIP varchar(64) NULL;
GO
IF OBJECT_ID('hoc_thuat.PhienBanHocPhan','U') IS NULL CREATE TABLE hoc_thuat.PhienBanHocPhan(
 MaPhienBanHocPhan bigint IDENTITY PRIMARY KEY,MaHocPhan int NOT NULL REFERENCES hoc_thuat.HocPhan(MaHocPhan),SoPhienBan int NOT NULL CHECK(SoPhienBan>0),TenHocPhan nvarchar(250) NOT NULL,TenTiengAnh nvarchar(250) NULL,SoTinChi tinyint NULL CHECK(SoTinChi BETWEEN 1 AND 30),NgayTao datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),UNIQUE(MaHocPhan,SoPhienBan));
INSERT hoc_thuat.PhienBanHocPhan(MaHocPhan,SoPhienBan,TenHocPhan,TenTiengAnh,SoTinChi) SELECT h.MaHocPhan,1,h.TenHocPhan,h.TenTiengAnh,h.SoTinChiMacDinh FROM hoc_thuat.HocPhan h WHERE NOT EXISTS(SELECT 1 FROM hoc_thuat.PhienBanHocPhan v WHERE v.MaHocPhan=h.MaHocPhan);
IF OBJECT_ID('hoc_thuat.LopQuanLy','U') IS NULL CREATE TABLE hoc_thuat.LopQuanLy(
 MaLopQuanLy bigint IDENTITY PRIMARY KEY,KyHieu varchar(40) NOT NULL UNIQUE,TenLop nvarchar(250) NOT NULL,MaPhienBan int NOT NULL REFERENCES hoc_thuat.PhienBanChuongTrinh(MaPhienBan),MaDonVi int NOT NULL REFERENCES danh_muc.DonVi(MaDonVi),KhoaNhapHoc varchar(30) NOT NULL,DangTiepNhan bit NOT NULL DEFAULT 1,PhienBanDuLieu rowversion);
IF COL_LENGTH('hoc_thuat.HocVien','MaLopQuanLy') IS NULL ALTER TABLE hoc_thuat.HocVien ADD MaLopQuanLy bigint NULL REFERENCES hoc_thuat.LopQuanLy(MaLopQuanLy);
IF OBJECT_ID('hoc_thuat.DeTaiHocVien','U') IS NULL CREATE TABLE hoc_thuat.DeTaiHocVien(
 MaDeTai bigint IDENTITY PRIMARY KEY,MaHocVien bigint NOT NULL UNIQUE REFERENCES hoc_thuat.HocVien(MaHocVien),TenDeTai nvarchar(500) NOT NULL,MaGVHD bigint NOT NULL REFERENCES nhan_su.CanBo(MaCanBo),TrangThai varchar(30) NOT NULL DEFAULT 'NHAP' CHECK(TrangThai IN('NHAP','DA_DUYET','DANG_THUC_HIEN','DA_NGHIEM_THU')),BaoCaoTienDo nvarchar(2000) NULL,NgayCapNhat datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),PhienBanDuLieu rowversion);
IF OBJECT_ID('hoc_thuat.HoiDongBaoVe','U') IS NULL CREATE TABLE hoc_thuat.HoiDongBaoVe(
 MaHoiDong bigint IDENTITY PRIMARY KEY,MaDeTai bigint NOT NULL REFERENCES hoc_thuat.DeTaiHocVien(MaDeTai),NgayBaoVe date NOT NULL,DiaDiem nvarchar(250) NOT NULL,TrangThai varchar(20) NOT NULL DEFAULT 'DU_KIEN' CHECK(TrangThai IN('DU_KIEN','DA_DUYET','DAT','KHONG_DAT','HUY')),DiemBaoVe decimal(4,2) NULL CHECK(DiemBaoVe BETWEEN 0 AND 10),NhanXet nvarchar(2000) NULL,PhienBanDuLieu rowversion,
 CHECK((TrangThai IN('DAT','KHONG_DAT') AND DiemBaoVe IS NOT NULL) OR(TrangThai NOT IN('DAT','KHONG_DAT') AND DiemBaoVe IS NULL)));
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('hoc_thuat.HoiDongBaoVe') AND name='UX_HoiDong_DangMo') CREATE UNIQUE INDEX UX_HoiDong_DangMo ON hoc_thuat.HoiDongBaoVe(MaDeTai) WHERE TrangThai IN('DU_KIEN','DA_DUYET');
IF OBJECT_ID('hoc_thuat.ThanhVienBaoVe','U') IS NULL CREATE TABLE hoc_thuat.ThanhVienBaoVe(
 MaThanhVien bigint IDENTITY PRIMARY KEY,MaHoiDong bigint NOT NULL REFERENCES hoc_thuat.HoiDongBaoVe(MaHoiDong),MaCanBo bigint NOT NULL REFERENCES nhan_su.CanBo(MaCanBo),VaiTro varchar(20) NOT NULL CHECK(VaiTro IN('CHU_TICH','THU_KY','PHAN_BIEN','UY_VIEN')),UNIQUE(MaHoiDong,MaCanBo));
IF OBJECT_ID('hoc_thuat.QuyDinhTotNghiep','U') IS NULL CREATE TABLE hoc_thuat.QuyDinhTotNghiep(
 MaQuyDinh bigint IDENTITY PRIMARY KEY,MaPhienBan int NOT NULL UNIQUE REFERENCES hoc_thuat.PhienBanChuongTrinh(MaPhienBan),ChuanNgoaiNgu nvarchar(200) NOT NULL,DiemBaoVeDat decimal(4,2) NOT NULL CHECK(DiemBaoVeDat BETWEEN 0 AND 10),SoVanBan nvarchar(100) NOT NULL,PhienBanDuLieu rowversion);
IF OBJECT_ID('hoc_thuat.MinhChungNgoaiNgu','U') IS NULL CREATE TABLE hoc_thuat.MinhChungNgoaiNgu(
 MaMinhChung bigint IDENTITY PRIMARY KEY,MaHocVien bigint NOT NULL UNIQUE REFERENCES hoc_thuat.HocVien(MaHocVien),ChungChi nvarchar(200) NOT NULL,SoHieu nvarchar(100) NOT NULL,NgayHetHan date NOT NULL,DaXacMinh bit NOT NULL DEFAULT 0,MaNguoiXacMinh bigint NULL REFERENCES danh_muc.Nguoi(MaNguoi),PhienBanDuLieu rowversion);
IF OBJECT_ID('hoc_thuat.KetQuaXetTotNghiep','U') IS NULL CREATE TABLE hoc_thuat.KetQuaXetTotNghiep(
 MaKetQua bigint IDENTITY PRIMARY KEY,MaHocVien bigint NOT NULL REFERENCES hoc_thuat.HocVien(MaHocVien),KetQua varchar(30) NOT NULL CHECK(KetQua IN('DU_DIEU_KIEN','CHUA_DU','THIEU_THONG_TIN')),ChiTiet nvarchar(1000) NOT NULL,ThoiDiem datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),MaNguoiThucHien bigint NOT NULL REFERENCES danh_muc.Nguoi(MaNguoi));
IF OBJECT_ID('he_thong.VanBanCongKhai','U') IS NULL CREATE TABLE he_thong.VanBanCongKhai(
 MaVanBan bigint IDENTITY PRIMARY KEY,SoVanBan nvarchar(100) NOT NULL UNIQUE,TieuDe nvarchar(300) NOT NULL,PhanLoai varchar(30) NOT NULL CHECK(PhanLoai IN('THONG_BAO','TUYEN_SINH','HUONG_DAN','QUY_DINH')),NgayBanHanh date NOT NULL,DuongDan nvarchar(1000) NOT NULL,TrangThai varchar(20) NOT NULL DEFAULT 'NHAP' CHECK(TrangThai IN('NHAP','CONG_BO','AN')),PhienBanDuLieu rowversion);
IF OBJECT_ID('he_thong.DangKyNhanThongTin','U') IS NULL CREATE TABLE he_thong.DangKyNhanThongTin(
 MaDangKy bigint IDENTITY PRIMARY KEY,HoTen nvarchar(150) NOT NULL,Email varchar(254) NOT NULL UNIQUE,NoiDung nvarchar(1000) NOT NULL,NgayDangKy datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),TrangThai varchar(20) NOT NULL DEFAULT 'MOI' CHECK(TrangThai IN('MOI','DA_LIEN_HE')),PhienBanDuLieu rowversion);
IF OBJECT_ID('he_thong.ThamSoDaoTao','U') IS NULL CREATE TABLE he_thong.ThamSoDaoTao(
 MaThamSo int PRIMARY KEY CHECK(MaThamSo=1),DiemDatMacDinh decimal(4,2) NOT NULL CHECK(DiemDatMacDinh BETWEEN 0 AND 10),NgoaiNguThacSi nvarchar(200) NULL,NgoaiNguTienSi nvarchar(200) NULL,PhienBanDuLieu rowversion);
IF NOT EXISTS(SELECT 1 FROM he_thong.ThamSoDaoTao) INSERT he_thong.ThamSoDaoTao(MaThamSo,DiemDatMacDinh) VALUES(1,5);
GO
CREATE OR ALTER VIEW hoc_thuat.v_DieuKienTotNghiep AS
 SELECT h.MaHocVien,h.MaNguoi,h.MaSoHocVien,n.HoTen,c.TenChuongTrinh,p.MaPhienBan,p.KhoaTuyenSinh,c.TrinhDo,p.TinChiToiThieu,t.TinChiTichLuy,t.DiemTrungBinh,p.DiemTrungBinhToiThieu,q.ChuanNgoaiNgu,
 CASE WHEN m.DaXacMinh=1 AND m.NgayHetHan>=CONVERT(date,GETDATE()) AND m.ChungChi=q.ChuanNgoaiNgu THEN 1 ELSE 0 END AS NgoaiNguDat,
 CASE WHEN EXISTS(SELECT 1 FROM hoc_thuat.HoiDongBaoVe b JOIN hoc_thuat.DeTaiHocVien d ON d.MaDeTai=b.MaDeTai WHERE d.MaHocVien=h.MaHocVien AND b.TrangThai='DAT' AND b.DiemBaoVe>=q.DiemBaoVeDat) THEN 1 ELSE 0 END AS BaoVeDat,
 CASE WHEN q.MaQuyDinh IS NULL THEN 'THIEU_THONG_TIN'
 WHEN t.TinChiTichLuy>=p.TinChiToiThieu AND t.DiemTrungBinh>=p.DiemTrungBinhToiThieu AND h.TrangThai IN('DANG_HOC','TOT_NGHIEP')
 AND NOT EXISTS(SELECT 1 FROM hoc_thuat.KhungHocPhan k WHERE k.MaPhienBan=p.MaPhienBan AND k.BatBuoc=1 AND NOT EXISTS(SELECT 1 FROM hoc_thuat.DangKyHocPhan dk JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan=dk.MaLopHocPhan WHERE dk.MaHocVien=h.MaHocVien AND l.MaHocPhan=k.MaHocPhan AND l.MaPhienBan=p.MaPhienBan AND dk.DaKhoaDiem=1 AND dk.DiemTongKet>=p.DiemDatHocPhan))
 AND m.DaXacMinh=1 AND m.NgayHetHan>=CONVERT(date,GETDATE()) AND m.ChungChi=q.ChuanNgoaiNgu
 AND EXISTS(SELECT 1 FROM hoc_thuat.HoiDongBaoVe b JOIN hoc_thuat.DeTaiHocVien d ON d.MaDeTai=b.MaDeTai WHERE d.MaHocVien=h.MaHocVien AND b.TrangThai='DAT' AND b.DiemBaoVe>=q.DiemBaoVeDat)
 THEN 'DU_DIEU_KIEN' WHEN m.MaMinhChung IS NULL THEN 'THIEU_THONG_TIN' ELSE 'CHUA_DU' END AS KetQua
 FROM hoc_thuat.HocVien h JOIN danh_muc.Nguoi n ON n.MaNguoi=h.MaNguoi JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=h.MaPhienBan JOIN hoc_thuat.ChuongTrinh c ON c.MaChuongTrinh=p.MaChuongTrinh LEFT JOIN hoc_thuat.v_TienDoHocTap t ON t.MaHocVien=h.MaHocVien LEFT JOIN hoc_thuat.QuyDinhTotNghiep q ON q.MaPhienBan=p.MaPhienBan LEFT JOIN hoc_thuat.MinhChungNgoaiNgu m ON m.MaHocVien=h.MaHocVien;
GO
