SET XACT_ABORT ON;
GO
IF OBJECT_ID('he_thong.YeuCauKhoiPhucMatKhau','U') IS NULL BEGIN
 CREATE TABLE he_thong.YeuCauKhoiPhucMatKhau(
  MaYeuCau bigint IDENTITY PRIMARY KEY,MaTaiKhoan bigint NOT NULL REFERENCES he_thong.TaiKhoanDangNhap(MaTaiKhoan),
  TrangThai varchar(20) NOT NULL DEFAULT 'CHO_XAC_MINH' CHECK(TrangThai IN('CHO_XAC_MINH','DA_CAP_MA','DA_SU_DUNG','TU_CHOI')),
  HieuLuc bit NOT NULL DEFAULT 1,NgayYeuCau datetime2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  MaBamMaKhoiPhuc char(64) NULL,HanSuDung datetime2(0) NULL,PhienBanMatKhau int NULL,
  MaNguoiXacMinh bigint NULL REFERENCES danh_muc.Nguoi(MaNguoi),NgayXacMinh datetime2(0) NULL,
  GhiChuXacMinh nvarchar(500) NULL,NgaySuDung datetime2(0) NULL,PhienBanDuLieu rowversion,
  CHECK(TrangThai<>'DA_CAP_MA' OR (MaBamMaKhoiPhuc IS NOT NULL AND HanSuDung IS NOT NULL AND PhienBanMatKhau IS NOT NULL AND MaNguoiXacMinh IS NOT NULL)),
  CHECK(TrangThai<>'DA_SU_DUNG' OR (HieuLuc=0 AND NgaySuDung IS NOT NULL))
 );
 CREATE UNIQUE INDEX UX_KhoiPhuc_DangXuLy ON he_thong.YeuCauKhoiPhucMatKhau(MaTaiKhoan) WHERE HieuLuc=1;
 CREATE UNIQUE INDEX UX_KhoiPhuc_MaBam ON he_thong.YeuCauKhoiPhucMatKhau(MaBamMaKhoiPhuc) WHERE MaBamMaKhoiPhuc IS NOT NULL;
END;
GO

SET XACT_ABORT ON;
GO
IF COL_LENGTH('he_thong.YeuCauKhoiPhucMatKhau','KenhKhoiPhuc') IS NULL
 ALTER TABLE he_thong.YeuCauKhoiPhucMatKhau ADD KenhKhoiPhuc varchar(20) NOT NULL CONSTRAINT DF_KhoiPhuc_Kenh DEFAULT 'QUAN_TRI' WITH VALUES;
GO
-- An email link proves mailbox access; it does not record an administrator verification.
DECLARE @Ten sysname,@Lenh nvarchar(max);
SELECT @Ten=name FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('he_thong.YeuCauKhoiPhucMatKhau') AND definition LIKE '%DA_CAP_MA%' AND definition LIKE '%MaNguoiXacMinh%';
IF @Ten IS NOT NULL BEGIN SET @Lenh=N'ALTER TABLE he_thong.YeuCauKhoiPhucMatKhau DROP CONSTRAINT '+QUOTENAME(@Ten);EXEC(@Lenh);END;
ALTER TABLE he_thong.YeuCauKhoiPhucMatKhau WITH CHECK ADD CONSTRAINT CK_KhoiPhuc_DaCapMa CHECK(TrangThai<>'DA_CAP_MA' OR (MaBamMaKhoiPhuc IS NOT NULL AND HanSuDung IS NOT NULL AND PhienBanMatKhau IS NOT NULL AND (KenhKhoiPhuc='EMAIL' OR MaNguoiXacMinh IS NOT NULL)));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('he_thong.YeuCauKhoiPhucMatKhau') AND name='CK_KhoiPhuc_Kenh')
 ALTER TABLE he_thong.YeuCauKhoiPhucMatKhau WITH CHECK ADD CONSTRAINT CK_KhoiPhuc_Kenh CHECK(KenhKhoiPhuc IN('EMAIL','QUAN_TRI'));
GO
