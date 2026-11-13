-- Bo sung cho chuc nang dang nhap va doi mat khau cua tai khoan cuc bo.
-- Khong chua mat khau mac dinh; backend khoi tao hash tu cau hinh lan dau.
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
IF DB_NAME() IN (N'master',N'model',N'msdb',N'tempdb')
    THROW 51000,N'Hay chon co so du lieu nghiep vu.',1;
IF OBJECT_ID(N'he_thong.TaiKhoanDangNhap',N'U') IS NULL
BEGIN
    CREATE TABLE he_thong.TaiKhoanDangNhap (
        MaTaiKhoan bigint IDENTITY PRIMARY KEY,
        MaNguoi bigint NOT NULL UNIQUE REFERENCES danh_muc.Nguoi(MaNguoi),
        TenDangNhap nvarchar(100) NOT NULL UNIQUE,
        MatKhauBam varchar(512) NOT NULL,
        PhienBanMatKhau int NOT NULL DEFAULT 1 CHECK (PhienBanMatKhau > 0),
        DangHoatDong bit NOT NULL DEFAULT 1,
        NgayDoiMatKhau datetime2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO
-- Phan quyen tai khoan do quan tri vien cap; mac dinh USER.
SET XACT_ABORT ON;
IF OBJECT_ID(N'he_thong.TaiKhoanDangNhap',N'U') IS NULL
    THROW 51000,N'Chay file 03_TaiKhoan.sql tu dau.',1;
IF COL_LENGTH(N'he_thong.TaiKhoanDangNhap',N'VaiTro') IS NULL
BEGIN
    BEGIN TRANSACTION;
    ALTER TABLE he_thong.TaiKhoanDangNhap ADD VaiTro varchar(20) NOT NULL
        CONSTRAINT DF_TaiKhoan_VaiTro DEFAULT 'USER' WITH VALUES;
    -- Chi phan loai tai khoan quan tri da ton tai tai thoi diem nang cap.
    -- Dynamic SQL de SQL Server bien dich sau khi cot moi da duoc them.
    EXEC(N'UPDATE t SET VaiTro=''ADMIN'' FROM he_thong.TaiKhoanDangNhap t JOIN nhan_su.CanBo c ON c.MaNguoi=t.MaNguoi');
    EXEC(N'ALTER TABLE he_thong.TaiKhoanDangNhap ADD CONSTRAINT CK_TaiKhoan_VaiTro CHECK (VaiTro IN (''ADMIN'',''USER''))');
    COMMIT;
END;
GO
-- Bo sung xoa tai khoan co luu vet va phien ban du lieu cho quan tri tai khoan.
SET XACT_ABORT ON;
SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON;
SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF;
IF OBJECT_ID(N'he_thong.TaiKhoanDangNhap',N'U') IS NULL
  THROW 51200,N'Cần tạo bảng tài khoản trước.',1;
IF COL_LENGTH(N'he_thong.TaiKhoanDangNhap',N'DaXoa') IS NULL
  ALTER TABLE he_thong.TaiKhoanDangNhap ADD DaXoa bit NOT NULL CONSTRAINT DF_TaiKhoan_DaXoa DEFAULT 0 WITH VALUES;
IF COL_LENGTH(N'he_thong.TaiKhoanDangNhap',N'NgayXoa') IS NULL
  ALTER TABLE he_thong.TaiKhoanDangNhap ADD NgayXoa datetime2(0) NULL;
IF COL_LENGTH(N'he_thong.TaiKhoanDangNhap',N'PhienBanDuLieu') IS NULL
  ALTER TABLE he_thong.TaiKhoanDangNhap ADD PhienBanDuLieu rowversion;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_TaiKhoan_Xoa')
  ALTER TABLE he_thong.TaiKhoanDangNhap ADD CONSTRAINT CK_TaiKhoan_Xoa CHECK
    ((DaXoa=0 AND NgayXoa IS NULL) OR (DaXoa=1 AND NgayXoa IS NOT NULL AND DangHoatDong=0));
GO
