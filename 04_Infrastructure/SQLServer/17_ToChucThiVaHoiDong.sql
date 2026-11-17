-- Mục VI: hội đồng tuyển sinh riêng, giữ nguyên lịch và phân công hiện có.
IF OBJECT_ID('tuyen_sinh.HoiDong','U') IS NULL
 CREATE TABLE tuyen_sinh.HoiDong(
  MaHoiDong int IDENTITY PRIMARY KEY,MaDot int NOT NULL REFERENCES tuyen_sinh.DotTuyen(MaDot),
  TenHoiDong nvarchar(200) NOT NULL,Loai varchar(20) NOT NULL CHECK(Loai IN('THI_TUYEN','CHAM_THI','DE_CUONG')),
  SoQuyetDinh nvarchar(100) NOT NULL,TrangThai varchar(20) NOT NULL DEFAULT 'NHAP' CHECK(TrangThai IN('NHAP','DA_DUYET','HUY')),
  Revision rowversion,UNIQUE(MaDot,SoQuyetDinh,TenHoiDong));
IF OBJECT_ID('tuyen_sinh.ThanhVienHoiDong','U') IS NULL
 CREATE TABLE tuyen_sinh.ThanhVienHoiDong(
  MaThanhVien int IDENTITY PRIMARY KEY,MaHoiDong int NOT NULL REFERENCES tuyen_sinh.HoiDong(MaHoiDong),
  MaCanBo bigint NOT NULL REFERENCES nhan_su.CanBo(MaCanBo),VaiTro varchar(20) NOT NULL CHECK(VaiTro IN('CHU_TICH','THU_KY','COI_THI','CHAM_THI')),
  UNIQUE(MaHoiDong,MaCanBo,VaiTro));
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tuyen_sinh.ThanhVienHoiDong') AND name='UX_HoiDong_ChuTri')
 CREATE UNIQUE INDEX UX_HoiDong_ChuTri ON tuyen_sinh.ThanhVienHoiDong(MaHoiDong,VaiTro) WHERE VaiTro IN('CHU_TICH','THU_KY');
IF COL_LENGTH('tuyen_sinh.CaThi','MaHoiDong') IS NULL ALTER TABLE tuyen_sinh.CaThi ADD MaHoiDong int NULL REFERENCES tuyen_sinh.HoiDong(MaHoiDong);
IF COL_LENGTH('tuyen_sinh.CaThi','MaChiTieu') IS NULL ALTER TABLE tuyen_sinh.CaThi ADD MaChiTieu int NULL REFERENCES tuyen_sinh.ChiTieu(MaChiTieu);
IF COL_LENGTH('tuyen_sinh.DotTuyen','MauSoBaoDanh') IS NULL ALTER TABLE tuyen_sinh.DotTuyen ADD MauSoBaoDanh varchar(50) NOT NULL CONSTRAINT DF_Dot_MauSBD DEFAULT '{DOT}-{SO}';
IF COL_LENGTH('tuyen_sinh.DotTuyen','DoDaiSoBaoDanh') IS NULL ALTER TABLE tuyen_sinh.DotTuyen ADD DoDaiSoBaoDanh int NOT NULL CONSTRAINT DF_Dot_DoDaiSBD DEFAULT 7 CHECK(DoDaiSoBaoDanh BETWEEN 1 AND 15);
GO
