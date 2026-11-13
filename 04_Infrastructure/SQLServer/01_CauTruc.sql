SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON; SET XACT_ABORT ON;
IF DB_NAME() IN(N'master',N'model',N'msdb',N'tempdb') THROW 51000,N'Chọn database nghiệp vụ.',1;
EXEC(N'CREATE SCHEMA danh_muc');
EXEC(N'CREATE SCHEMA he_thong');
EXEC(N'CREATE SCHEMA nhan_su');
EXEC(N'CREATE SCHEMA hoc_thuat');
CREATE TABLE danh_muc.DonVi (
    MaDonVi int IDENTITY PRIMARY KEY,
    KyHieu varchar(30) NOT NULL UNIQUE,
    TenDonVi nvarchar(200) NOT NULL
);
CREATE TABLE danh_muc.Nganh (
    MaNganh int IDENTITY PRIMARY KEY,
    KyHieu varchar(30) NOT NULL UNIQUE,
    TenNganh nvarchar(200) NOT NULL,
    MaDonVi int NOT NULL REFERENCES danh_muc.DonVi(MaDonVi)
);
CREATE TABLE danh_muc.Nguoi (
    MaNguoi bigint IDENTITY PRIMARY KEY,
    HoTen nvarchar(150) NOT NULL,
    NgaySinh date NULL,
    SoGiayTo varchar(20) NULL,
    ThuDienTu varchar(254) NULL,
    SoDienThoai varchar(20) NULL,
    NgayTao datetime2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    PhienBanDuLieu rowversion
);
CREATE TABLE he_thong.NhatKyThayDoi (
    MaNhatKy bigint IDENTITY PRIMARY KEY,
    PhanHe varchar(40) NOT NULL,
    TenDoiTuong varchar(80) NOT NULL,
    MaDoiTuong bigint NOT NULL,
    HanhDong varchar(60) NOT NULL,
    MaNguoiThucHien bigint NOT NULL REFERENCES danh_muc.Nguoi(MaNguoi),
    TaiKhoanKetNoi nvarchar(128) NOT NULL DEFAULT ORIGINAL_LOGIN(),
    ThoiDiem datetime2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    ChiTiet nvarchar(max) NULL CHECK (ChiTiet IS NULL OR ISJSON(ChiTiet) = 1)
);
CREATE TABLE nhan_su.CanBo (
    MaCanBo bigint IDENTITY PRIMARY KEY,
    MaNguoi bigint NOT NULL UNIQUE REFERENCES danh_muc.Nguoi(MaNguoi),
    MaDonVi int NOT NULL REFERENCES danh_muc.DonVi(MaDonVi),
    HocVi varchar(20) NOT NULL CHECK (HocVi IN ('THAC_SI','TIEN_SI')),
    DangHoatDong bit NOT NULL DEFAULT 1
);
CREATE TABLE hoc_thuat.ChuongTrinh (
    MaChuongTrinh int IDENTITY PRIMARY KEY,
    KyHieu varchar(30) NOT NULL UNIQUE,
    TenChuongTrinh nvarchar(250) NOT NULL,
    MaNganh int NOT NULL REFERENCES danh_muc.Nganh(MaNganh),
    TrinhDo varchar(20) NOT NULL CHECK (TrinhDo IN ('THAC_SI','TIEN_SI'))
);
CREATE TABLE hoc_thuat.PhienBanChuongTrinh (
    MaPhienBan int IDENTITY PRIMARY KEY,
    MaChuongTrinh int NOT NULL REFERENCES hoc_thuat.ChuongTrinh(MaChuongTrinh),
    SoPhienBan smallint NOT NULL CHECK (SoPhienBan > 0),
    KhoaTuyenSinh varchar(30) NOT NULL,
    TinChiToiThieu smallint NOT NULL CHECK (TinChiToiThieu > 0),
    DiemDatHocPhan decimal(4,2) NOT NULL DEFAULT 5 CHECK (DiemDatHocPhan BETWEEN 0 AND 10),
    DiemTrungBinhToiThieu decimal(4,2) NOT NULL DEFAULT 5 CHECK (DiemTrungBinhToiThieu BETWEEN 0 AND 10),
    ThoiGianToiDaThang smallint NOT NULL CHECK (ThoiGianToiDaThang > 0),
    TrangThai varchar(20) NOT NULL DEFAULT 'NHAP' CHECK (TrangThai IN ('NHAP','DA_DUYET')),
    MaCanBoPheDuyet bigint NULL REFERENCES nhan_su.CanBo(MaCanBo),
    NgayPheDuyet datetime2(0) NULL,
    PhienBanDuLieu rowversion,
    UNIQUE (MaChuongTrinh, SoPhienBan),
    UNIQUE (MaChuongTrinh, KhoaTuyenSinh),
    CHECK ((TrangThai = 'NHAP' AND MaCanBoPheDuyet IS NULL AND NgayPheDuyet IS NULL)
        OR (TrangThai = 'DA_DUYET' AND MaCanBoPheDuyet IS NOT NULL AND NgayPheDuyet IS NOT NULL))
);
CREATE TABLE hoc_thuat.HocPhan (
    MaHocPhan int IDENTITY PRIMARY KEY,
    KyHieu varchar(30) NOT NULL UNIQUE,
    TenHocPhan nvarchar(250) NOT NULL
);
CREATE TABLE hoc_thuat.KhungHocPhan (
    MaPhienBan int NOT NULL REFERENCES hoc_thuat.PhienBanChuongTrinh(MaPhienBan),
    MaHocPhan int NOT NULL REFERENCES hoc_thuat.HocPhan(MaHocPhan),
    TenHocPhan nvarchar(250) NOT NULL, -- Snapshot: doi danh muc khong doi khoa cu.
    SoTinChi tinyint NOT NULL CHECK (SoTinChi BETWEEN 1 AND 30),
    HocKyDuKien tinyint NOT NULL CHECK (HocKyDuKien BETWEEN 1 AND 20),
    BatBuoc bit NOT NULL DEFAULT 1,
    PRIMARY KEY (MaPhienBan, MaHocPhan)
);
CREATE TABLE hoc_thuat.HocPhanTienQuyet (
    MaPhienBan int NOT NULL,
    MaHocPhan int NOT NULL,
    MaHocPhanTienQuyet int NOT NULL,
    PRIMARY KEY (MaPhienBan, MaHocPhan, MaHocPhanTienQuyet),
    FOREIGN KEY (MaPhienBan, MaHocPhan) REFERENCES hoc_thuat.KhungHocPhan(MaPhienBan, MaHocPhan),
    FOREIGN KEY (MaPhienBan, MaHocPhanTienQuyet) REFERENCES hoc_thuat.KhungHocPhan(MaPhienBan, MaHocPhan),
    CHECK (MaHocPhan <> MaHocPhanTienQuyet)
);
CREATE TABLE hoc_thuat.HocVien (
    MaHocVien bigint IDENTITY PRIMARY KEY,
    MaSoHocVien varchar(30) NOT NULL UNIQUE,
    MaNguoi bigint NOT NULL REFERENCES danh_muc.Nguoi(MaNguoi),
    MaPhienBan int NOT NULL REFERENCES hoc_thuat.PhienBanChuongTrinh(MaPhienBan),
    NgayNhapHoc date NOT NULL,
    HanDaoTao date NOT NULL,
    TrangThai varchar(30) NOT NULL DEFAULT 'DANG_HOC' CHECK (TrangThai IN ('DANG_HOC','BAO_LUU','THOI_HOC','TOT_NGHIEP')),
    PhienBanDuLieu rowversion,
    CHECK (HanDaoTao >= NgayNhapHoc)
);
CREATE TABLE hoc_thuat.LopHocPhan (
    MaLopHocPhan bigint IDENTITY PRIMARY KEY,
    KyHieu varchar(40) NOT NULL UNIQUE,
    MaPhienBan int NOT NULL,
    MaHocPhan int NOT NULL,
    MaGiangVien bigint NOT NULL REFERENCES nhan_su.CanBo(MaCanBo),
    NamHoc varchar(15) NOT NULL,
    HocKy tinyint NOT NULL CHECK (HocKy BETWEEN 1 AND 3),
    SiSoToiDa smallint NOT NULL CHECK (SiSoToiDa > 0),
    FOREIGN KEY (MaPhienBan, MaHocPhan) REFERENCES hoc_thuat.KhungHocPhan(MaPhienBan, MaHocPhan)
);
CREATE TABLE hoc_thuat.DangKyHocPhan (
    MaDangKy bigint IDENTITY PRIMARY KEY,
    MaHocVien bigint NOT NULL REFERENCES hoc_thuat.HocVien(MaHocVien),
    MaLopHocPhan bigint NOT NULL REFERENCES hoc_thuat.LopHocPhan(MaLopHocPhan),
    NgayDangKy datetime2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    TrangThai varchar(20) NOT NULL DEFAULT 'DANG_HOC' CHECK (TrangThai IN ('DANG_HOC','HOAN_THANH','HUY')),
    DiemTongKet decimal(4,2) NULL CHECK (DiemTongKet BETWEEN 0 AND 10),
    DaKhoaDiem bit NOT NULL DEFAULT 0,
    UNIQUE (MaHocVien, MaLopHocPhan),
    CHECK ((TrangThai = 'HOAN_THANH' AND DiemTongKet IS NOT NULL AND DaKhoaDiem = 1)
        OR (TrangThai <> 'HOAN_THANH' AND DiemTongKet IS NULL AND DaKhoaDiem = 0))
);
CREATE UNIQUE INDEX UQ_Nguoi_SoGiayTo ON danh_muc.Nguoi(SoGiayTo) WHERE SoGiayTo IS NOT NULL;
CREATE UNIQUE INDEX UQ_Nguoi_ThuDienTu ON danh_muc.Nguoi(ThuDienTu) WHERE ThuDienTu IS NOT NULL;
CREATE INDEX IX_HocVien_Nguoi ON hoc_thuat.HocVien(MaNguoi,MaPhienBan);
GO
