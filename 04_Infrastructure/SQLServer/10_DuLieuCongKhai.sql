-- Published source facts can be incomplete. They must not become executable rules.
SET XACT_ABORT ON;SET QUOTED_IDENTIFIER ON;
ALTER TABLE he_thong.VanBanCongKhai ALTER COLUMN NgayBanHanh date NULL;
IF COL_LENGTH('he_thong.VanBanCongKhai','NguonUrl') IS NULL
 ALTER TABLE he_thong.VanBanCongKhai ADD NguonUrl nvarchar(1000) NULL,MaDinhDanhNoiBo bit NOT NULL DEFAULT 0;
IF COL_LENGTH('hoc_thuat.ChuongTrinh','NguonUrl') IS NULL
 ALTER TABLE hoc_thuat.ChuongTrinh ADD NguonUrl nvarchar(1000) NULL,BanSaoUrl nvarchar(1000) NULL,MoTaNguon nvarchar(1000) NULL,SoTinChiCongBo smallint NULL,ThoiGianChuanThang smallint NULL,HienThiCongKhai bit NOT NULL DEFAULT 0,KhungCongKhai nvarchar(max) NULL CHECK(KhungCongKhai IS NULL OR ISJSON(KhungCongKhai)=1);
IF COL_LENGTH('tuyen_sinh.DotTuyen','NguonUrl') IS NULL
 ALTER TABLE tuyen_sinh.DotTuyen ADD NguonUrl nvarchar(1000) NULL,BanSaoUrl nvarchar(1000) NULL,SoVanBan nvarchar(100) NULL,NgayBanHanh date NULL,NhapHocDuKien nvarchar(100) NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN MoHoSo datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN DongHoSo datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN HanThamDinh datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN HanBoSung datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN NgayThi datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN NgayCongBo datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN HanPhucKhao datetime2 NULL;
ALTER TABLE tuyen_sinh.DotTuyen ALTER COLUMN HanNhapHoc datetime2 NULL;
IF COL_LENGTH('tuyen_sinh.ChiTieu','QuyTacDaXacNhan') IS NULL
 ALTER TABLE tuyen_sinh.ChiTieu ADD QuyTacDaXacNhan bit NOT NULL DEFAULT 1,DuKien bit NOT NULL DEFAULT 0,PhiDangKy int NULL,PhiXetTuyen int NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN LePhi int NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN PhiNhapHoc int NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN GpaToiThieu decimal(4,2) NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN HeSoCoSo decimal(6,3) NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN HeSoChuyenNganh decimal(6,3) NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN HeSoNgoaiNgu decimal(6,3) NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN HeSoUuTien decimal(6,3) NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN DiemSan decimal(8,3) NULL;
ALTER TABLE tuyen_sinh.ChiTieu ALTER COLUMN TieuChiPhu varchar(20) NULL;
DECLARE @Lenh nvarchar(max)=N'';
SELECT @Lenh+=N'ALTER TABLE tuyen_sinh.ChiTieu DROP CONSTRAINT '+QUOTENAME(name)+N';' FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('tuyen_sinh.ChiTieu') AND definition LIKE '%PhuongThuc%';
IF @Lenh<>N'' EXEC(@Lenh);
ALTER TABLE tuyen_sinh.ChiTieu ADD CONSTRAINT CK_ChiTieu_PhuongThuc CHECK(PhuongThuc IN('THI_TUYEN','XET_TUYEN','TUYEN_THANG','CHUNG'));
ALTER TABLE tuyen_sinh.ChuanNgoaiNgu ALTER COLUMN DiemQuyDoi decimal(4,2) NULL;
IF COL_LENGTH('tuyen_sinh.ChuanNgoaiNgu','BacTuongDuong') IS NULL
 ALTER TABLE tuyen_sinh.ChuanNgoaiNgu ADD BacTuongDuong tinyint NULL CHECK(BacTuongDuong BETWEEN 1 AND 6);
GO
