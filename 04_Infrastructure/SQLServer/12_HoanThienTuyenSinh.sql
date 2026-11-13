SET XACT_ABORT ON;
GO
IF OBJECT_ID('tuyen_sinh.MauLyDo','U') IS NULL CREATE TABLE tuyen_sinh.MauLyDo(
 MaMau int IDENTITY PRIMARY KEY,MaLyDo varchar(40) NOT NULL UNIQUE,
 TenLyDo nvarchar(300) NOT NULL,NoiDungMau nvarchar(1500) NOT NULL,
 DangSuDung bit NOT NULL DEFAULT 1,Revision rowversion);
-- Seed only on the first upgrade: do not restore templates retired by the school.
IF NOT EXISTS(SELECT 1 FROM tuyen_sinh.MauLyDo)
 INSERT tuyen_sinh.MauLyDo(MaLyDo,TenLyDo,NoiDungMau) VALUES
 ('TAI_LIEU_MO',N'Tài liệu bị mờ hoặc không đọc được',N'Vui lòng tải lại bản chụp rõ nét, đủ các trang.'),
 ('THIEU_XAC_NHAN',N'Tài liệu thiếu dấu hoặc xác nhận',N'Vui lòng bổ sung bản có dấu hoặc xác nhận theo yêu cầu.'),
 ('THIEU_MINH_CHUNG',N'Thiếu tài liệu minh chứng bắt buộc',N'Vui lòng bổ sung các minh chứng được cán bộ liệt kê.'),
 ('SAI_THONG_TIN',N'Thông tin khai báo không khớp minh chứng',N'Vui lòng đối chiếu và sửa các thông tin được chỉ rõ.'),
 ('HET_HIEU_LUC',N'Chứng chỉ hoặc giấy tờ đã hết hiệu lực',N'Vui lòng bổ sung chứng chỉ hoặc giấy tờ còn hiệu lực.');
IF COL_LENGTH('tuyen_sinh.CaThi','ThanhPhan') IS NULL
 ALTER TABLE tuyen_sinh.CaThi ADD ThanhPhan varchar(20) NOT NULL CONSTRAINT DF_CaThi_ThanhPhan DEFAULT 'TONG_HOP' CHECK(ThanhPhan IN('TONG_HOP','CO_SO','CHUYEN_NGANH'));
IF COL_LENGTH('tuyen_sinh.PhanPhong','ThanhPhan') IS NULL
 ALTER TABLE tuyen_sinh.PhanPhong ADD ThanhPhan varchar(20) NOT NULL CONSTRAINT DF_PhanPhong_ThanhPhan DEFAULT 'TONG_HOP';
GO
-- Retain every existing assignment; replace only the two single-column unique constraints.
DECLARE @drop nvarchar(max)=N'';
SELECT @drop+=N'ALTER TABLE tuyen_sinh.PhanPhong DROP CONSTRAINT '+QUOTENAME(k.name)+N';'
 FROM sys.key_constraints k WHERE k.parent_object_id=OBJECT_ID('tuyen_sinh.PhanPhong') AND k.type='UQ'
 AND (SELECT COUNT(*) FROM sys.index_columns i WHERE i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id AND i.key_ordinal>0)=1
 AND EXISTS(SELECT 1 FROM sys.index_columns i JOIN sys.columns c ON c.object_id=i.object_id AND c.column_id=i.column_id
 WHERE i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id AND c.name IN('MaHoSo','SoBaoDanh'));
IF @drop<>N'' EXEC(@drop);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tuyen_sinh.PhanPhong') AND name='UX_PhanPhong_ThanhPhan')
 CREATE UNIQUE INDEX UX_PhanPhong_ThanhPhan ON tuyen_sinh.PhanPhong(MaHoSo,ThanhPhan);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tuyen_sinh.PhanPhong') AND name='UX_SBD_ThanhPhan')
 CREATE UNIQUE INDEX UX_SBD_ThanhPhan ON tuyen_sinh.PhanPhong(SoBaoDanh,ThanhPhan);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tuyen_sinh.CaThi') AND name='UX_CaThi_ThanhPhan')
 CREATE UNIQUE INDEX UX_CaThi_ThanhPhan ON tuyen_sinh.CaThi(MaCa,ThanhPhan);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_PhanPhong_ThanhPhan')
 ALTER TABLE tuyen_sinh.PhanPhong ADD CONSTRAINT FK_PhanPhong_ThanhPhan FOREIGN KEY(MaCa,ThanhPhan) REFERENCES tuyen_sinh.CaThi(MaCa,ThanhPhan);
IF OBJECT_ID('tuyen_sinh.DiemBaiThi','U') IS NULL CREATE TABLE tuyen_sinh.DiemBaiThi(
 MaPhanPhong bigint PRIMARY KEY REFERENCES tuyen_sinh.PhanPhong(MaPhanPhong),
 DiemMaHoa nvarchar(2000) NOT NULL,MaNguoiNhap bigint NOT NULL REFERENCES danh_muc.Nguoi(MaNguoi),
 NgayNhap datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),Revision rowversion);
IF OBJECT_ID('tuyen_sinh.KeHoachNhapHoc','U') IS NULL CREATE TABLE tuyen_sinh.KeHoachNhapHoc(
 MaKeHoach int IDENTITY PRIMARY KEY,MaChiTieu int NOT NULL UNIQUE REFERENCES tuyen_sinh.ChiTieu(MaChiTieu),
 MaPhienBan int NOT NULL REFERENCES hoc_thuat.PhienBanChuongTrinh(MaPhienBan),
 MaLopQuanLy bigint NULL REFERENCES hoc_thuat.LopQuanLy(MaLopQuanLy),
 MaGVHD bigint NULL REFERENCES nhan_su.CanBo(MaCanBo),LopHocPhan nvarchar(2000) NOT NULL DEFAULT N'[]' CHECK(ISJSON(LopHocPhan)=1),
 TuDong bit NOT NULL DEFAULT 0,MaNguoiCauHinh bigint NOT NULL REFERENCES danh_muc.Nguoi(MaNguoi),Revision rowversion);
IF OBJECT_ID('hoc_thuat.PhanCongHuongDan','U') IS NULL CREATE TABLE hoc_thuat.PhanCongHuongDan(
 MaHocVien bigint PRIMARY KEY REFERENCES hoc_thuat.HocVien(MaHocVien),
 MaCanBo bigint NOT NULL REFERENCES nhan_su.CanBo(MaCanBo),NgayPhanCong datetime2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('tuyen_sinh.MauBaoCao','U') IS NULL CREATE TABLE tuyen_sinh.MauBaoCao(
 MaMau int IDENTITY PRIMARY KEY,KyHieu varchar(40) NOT NULL UNIQUE,Loai varchar(20) NOT NULL CHECK(Loai IN('applications','accepted','revenue')),
 TieuDe nvarchar(300) NOT NULL,SoVanBan nvarchar(150) NOT NULL,NguonMauUrl nvarchar(1000) NOT NULL,
 CauHinhCot nvarchar(4000) NOT NULL CHECK(ISJSON(CauHinhCot)=1),TrangThai varchar(20) NOT NULL DEFAULT 'NHAP' CHECK(TrangThai IN('NHAP','DA_DUYET')),
 MaNguoiDuyet bigint NULL REFERENCES danh_muc.Nguoi(MaNguoi),NgayDuyet datetime2 NULL,Revision rowversion);
GO
DECLARE @check nvarchar(max)=N'';
SELECT @check+=N'ALTER TABLE tuyen_sinh.GiaoDich DROP CONSTRAINT '+QUOTENAME(name)+N';' FROM sys.check_constraints
 WHERE parent_object_id=OBJECT_ID('tuyen_sinh.GiaoDich') AND definition LIKE '%Kenh%';
IF @check<>N'' EXEC(@check);
ALTER TABLE tuyen_sinh.GiaoDich ADD CONSTRAINT CK_GiaoDich_Kenh CHECK(Kenh IN('VNPAY','MOMO','NGAN_HANG'));
IF COL_LENGTH('tuyen_sinh.BanGiao','SoLanThu') IS NULL ALTER TABLE tuyen_sinh.BanGiao ADD SoLanThu int NOT NULL DEFAULT 0;
IF COL_LENGTH('tuyen_sinh.BanGiao','NgayThuCuoi') IS NULL ALTER TABLE tuyen_sinh.BanGiao ADD NgayThuCuoi datetime2 NULL;
IF COL_LENGTH('tuyen_sinh.HoSo','LoiBanGiao') IS NULL ALTER TABLE tuyen_sinh.HoSo ADD LoiBanGiao nvarchar(500) NULL,LanThuBanGiao datetime2 NULL;
GO
