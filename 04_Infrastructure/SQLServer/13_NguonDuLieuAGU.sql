-- Provenance metadata only; never opens a historical intake or sets selection rules.
SET XACT_ABORT ON;
GO
IF COL_LENGTH('he_thong.VanBanCongKhai','GhiChuNguon') IS NULL ALTER TABLE he_thong.VanBanCongKhai ADD GhiChuNguon nvarchar(1000) NULL;
IF COL_LENGTH('he_thong.VanBanCongKhai','NgayKiemChung') IS NULL ALTER TABLE he_thong.VanBanCongKhai ADD NgayKiemChung date NULL;
IF COL_LENGTH('he_thong.VanBanCongKhai','KieuKiemChung') IS NULL ALTER TABLE he_thong.VanBanCongKhai ADD KieuKiemChung varchar(40) NULL;
IF COL_LENGTH('tuyen_sinh.DotTuyen','GhiChuNguon') IS NULL ALTER TABLE tuyen_sinh.DotTuyen ADD GhiChuNguon nvarchar(1000) NULL,NgayKiemChung date NULL,KieuKiemChung varchar(40) NULL;
GO
