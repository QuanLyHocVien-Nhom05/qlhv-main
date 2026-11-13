SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

GO

CREATE OR ALTER TRIGGER hoc_thuat.trg_KhoaPhienBan
ON hoc_thuat.PhienBanChuongTrinh AFTER UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM deleted WHERE TrangThai = 'DA_DUYET')
        THROW 51001, N'Phiên bản đã duyệt không được sửa/xóa. Hãy sao chép sang phiên bản mới.', 1;
END;

GO

CREATE OR ALTER TRIGGER hoc_thuat.trg_KhoaThongTinChuongTrinh
ON hoc_thuat.ChuongTrinh AFTER UPDATE, DELETE AS
BEGIN
    IF EXISTS (SELECT 1 FROM deleted d JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaChuongTrinh = d.MaChuongTrinh WHERE p.TrangThai = 'DA_DUYET')
        THROW 51002, N'Chương trình đã có phiên bản được duyệt; không đổi thông tin gốc.', 1;
END;

GO

CREATE OR ALTER TRIGGER hoc_thuat.trg_KiemTraKhungHocPhan
ON hoc_thuat.KhungHocPhan AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM hoc_thuat.PhienBanChuongTrinh p WITH (UPDLOCK, HOLDLOCK)
        JOIN (SELECT MaPhienBan FROM inserted UNION SELECT MaPhienBan FROM deleted) t ON t.MaPhienBan = p.MaPhienBan
        WHERE p.TrangThai = 'DA_DUYET')
        THROW 51003, N'Không được thay khung học phần của phiên bản đã duyệt.', 1;
    IF EXISTS (SELECT 1 FROM hoc_thuat.HocPhanTienQuyet q
        JOIN hoc_thuat.KhungHocPhan h ON h.MaPhienBan = q.MaPhienBan AND h.MaHocPhan = q.MaHocPhan
        JOIN hoc_thuat.KhungHocPhan t ON t.MaPhienBan = q.MaPhienBan AND t.MaHocPhan = q.MaHocPhanTienQuyet
        WHERE (h.HocKyDuKien <= t.HocKyDuKien OR (h.BatBuoc = 1 AND t.BatBuoc = 0))
          AND q.MaPhienBan IN (SELECT MaPhienBan FROM inserted UNION SELECT MaPhienBan FROM deleted))
        THROW 51004, N'Học kỳ hoặc loại học phần không đáp ứng quan hệ tiên quyết.', 1;
END;

GO

CREATE OR ALTER TRIGGER hoc_thuat.trg_KiemTraTienQuyet
ON hoc_thuat.HocPhanTienQuyet AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM hoc_thuat.PhienBanChuongTrinh p WITH (UPDLOCK, HOLDLOCK)
        JOIN (SELECT MaPhienBan FROM inserted UNION SELECT MaPhienBan FROM deleted) t ON t.MaPhienBan = p.MaPhienBan
        WHERE p.TrangThai = 'DA_DUYET')
        THROW 51003, N'Không được thay tiên quyết của phiên bản đã duyệt.', 1;
    IF EXISTS (SELECT 1 FROM inserted q
        JOIN hoc_thuat.KhungHocPhan h ON h.MaPhienBan = q.MaPhienBan AND h.MaHocPhan = q.MaHocPhan
        JOIN hoc_thuat.KhungHocPhan t ON t.MaPhienBan = q.MaPhienBan AND t.MaHocPhan = q.MaHocPhanTienQuyet
        WHERE h.HocKyDuKien <= t.HocKyDuKien OR (h.BatBuoc = 1 AND t.BatBuoc = 0))
        THROW 51004, N'Tiên quyết phải ở học kỳ trước; tiên quyết của môn bắt buộc cũng phải bắt buộc.', 1;
END;

GO

CREATE OR ALTER TRIGGER hoc_thuat.trg_KiemTraHocVien ON hoc_thuat.HocVien AFTER INSERT,UPDATE AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN deleted d ON d.MaHocVien=i.MaHocVien WHERE i.MaPhienBan<>d.MaPhienBan OR i.MaNguoi<>d.MaNguoi) THROW 51005,N'Không đổi người hoặc phiên bản của hồ sơ học viên đã tạo.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=i.MaPhienBan WHERE p.TrangThai<>'DA_DUYET') THROW 51005,N'Chỉ gán học viên vào phiên bản đã duyệt.',1;
END;

GO

CREATE OR ALTER PROCEDURE hoc_thuat.usp_PheDuyetPhienBan
    @MaPhienBan int, @MaCanBoPheDuyet bigint
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @TinChiToiThieu int, @TongTinChi int, @TinChiBatBuoc int, @MaNguoi bigint;
        SELECT @TinChiToiThieu = TinChiToiThieu FROM hoc_thuat.PhienBanChuongTrinh WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhienBan = @MaPhienBan AND TrangThai = 'NHAP';
        IF @TinChiToiThieu IS NULL THROW 51010, N'Không tìm thấy phiên bản nháp.', 1;
        SELECT @MaNguoi = MaNguoi FROM nhan_su.CanBo WHERE MaCanBo = @MaCanBoPheDuyet AND DangHoatDong = 1;
        IF @MaNguoi IS NULL THROW 51011, N'Cán bộ phê duyệt không hợp lệ.', 1;
        SELECT @TongTinChi = COALESCE(SUM(CONVERT(int, SoTinChi)),0),
            @TinChiBatBuoc = COALESCE(SUM(CASE WHEN BatBuoc = 1 THEN CONVERT(int, SoTinChi) ELSE 0 END),0)
        FROM hoc_thuat.KhungHocPhan WHERE MaPhienBan = @MaPhienBan;
        IF @TongTinChi < @TinChiToiThieu OR @TinChiBatBuoc > @TinChiToiThieu
            THROW 51012, N'Tổng khung chưa đủ tín chỉ hoặc tín chỉ bắt buộc vượt yêu cầu.', 1;
        UPDATE hoc_thuat.PhienBanChuongTrinh SET TrangThai = 'DA_DUYET', MaCanBoPheDuyet = @MaCanBoPheDuyet, NgayPheDuyet = SYSUTCDATETIME() WHERE MaPhienBan = @MaPhienBan;
        INSERT he_thong.NhatKyThayDoi(PhanHe, TenDoiTuong, MaDoiTuong, HanhDong, MaNguoiThucHien)
        VALUES ('HOC_THUAT','PhienBanChuongTrinh',@MaPhienBan,'PHE_DUYET',@MaNguoi);
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;
        THROW;
    END CATCH;
END;

GO

CREATE OR ALTER PROCEDURE hoc_thuat.usp_SaoChepPhienBan
    @MaPhienBanGoc int, @KhoaTuyenSinh varchar(30), @MaNguoiThucHien bigint, @MaPhienBanMoi int OUTPUT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @MaChuongTrinh int, @SoPhienBan smallint;
        SELECT @MaChuongTrinh = MaChuongTrinh FROM hoc_thuat.PhienBanChuongTrinh WHERE MaPhienBan = @MaPhienBanGoc;
        IF @MaChuongTrinh IS NULL OR NULLIF(LTRIM(RTRIM(@KhoaTuyenSinh)), '') IS NULL THROW 51013, N'Phiên bản gốc hoặc khóa tuyển sinh không hợp lệ.', 1;
        -- Khoa chuong trinh cha de hai lan sao chep khong cung sinh mot so phien ban.
        SELECT @MaChuongTrinh = MaChuongTrinh FROM hoc_thuat.ChuongTrinh WITH (UPDLOCK, HOLDLOCK) WHERE MaChuongTrinh = @MaChuongTrinh;
        SELECT @SoPhienBan = MAX(SoPhienBan) + 1 FROM hoc_thuat.PhienBanChuongTrinh WHERE MaChuongTrinh = @MaChuongTrinh;
        INSERT hoc_thuat.PhienBanChuongTrinh(MaChuongTrinh, SoPhienBan, KhoaTuyenSinh, TinChiToiThieu, DiemDatHocPhan, DiemTrungBinhToiThieu, ThoiGianToiDaThang)
        SELECT MaChuongTrinh, @SoPhienBan, LTRIM(RTRIM(@KhoaTuyenSinh)), TinChiToiThieu, DiemDatHocPhan, DiemTrungBinhToiThieu, ThoiGianToiDaThang
        FROM hoc_thuat.PhienBanChuongTrinh WHERE MaPhienBan = @MaPhienBanGoc;
        SET @MaPhienBanMoi = CONVERT(int,SCOPE_IDENTITY());
        INSERT hoc_thuat.KhungHocPhan SELECT @MaPhienBanMoi, MaHocPhan, TenHocPhan, SoTinChi, HocKyDuKien, BatBuoc FROM hoc_thuat.KhungHocPhan WHERE MaPhienBan = @MaPhienBanGoc;
        INSERT hoc_thuat.HocPhanTienQuyet SELECT @MaPhienBanMoi, MaHocPhan, MaHocPhanTienQuyet FROM hoc_thuat.HocPhanTienQuyet WHERE MaPhienBan = @MaPhienBanGoc;
        INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien) VALUES ('HOC_THUAT','PhienBanChuongTrinh',@MaPhienBanMoi,'SAO_CHEP',@MaNguoiThucHien);
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;
        THROW;
    END CATCH;
END;

GO

CREATE OR ALTER VIEW hoc_thuat.v_KetQuaHocPhan AS
SELECT d.MaHocVien, l.MaHocPhan, MAX(d.DiemTongKet) AS DiemTotNhat
FROM hoc_thuat.DangKyHocPhan d JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan = d.MaLopHocPhan
WHERE d.TrangThai = 'HOAN_THANH' AND d.DaKhoaDiem = 1
GROUP BY d.MaHocVien, l.MaHocPhan;

GO

CREATE OR ALTER VIEW hoc_thuat.v_TienDoHocTap AS
SELECT h.MaHocVien,
    COALESCE(SUM(CASE WHEN k.DiemTotNhat >= p.DiemDatHocPhan THEN CONVERT(int,c.SoTinChi) ELSE 0 END),0) AS TinChiTichLuy,
    CONVERT(decimal(5,2), SUM(k.DiemTotNhat * c.SoTinChi) / NULLIF(SUM(CASE WHEN k.DiemTotNhat IS NOT NULL THEN CONVERT(int,c.SoTinChi) ELSE 0 END),0)) AS DiemTrungBinh
FROM hoc_thuat.HocVien h
JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan = h.MaPhienBan
LEFT JOIN hoc_thuat.KhungHocPhan c ON c.MaPhienBan = h.MaPhienBan
LEFT JOIN hoc_thuat.v_KetQuaHocPhan k ON k.MaHocVien = h.MaHocVien AND k.MaHocPhan = c.MaHocPhan
GROUP BY h.MaHocVien;

GO

CREATE OR ALTER PROCEDURE hoc_thuat.usp_DangKyHocPhan @MaHocVien bigint, @MaLopHocPhan bigint
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @MaPhienBan int, @MaHocPhan int, @SiSoToiDa int, @MaNguoi bigint;
        SELECT @MaPhienBan = MaPhienBan, @MaHocPhan = MaHocPhan, @SiSoToiDa = SiSoToiDa FROM hoc_thuat.LopHocPhan WITH (UPDLOCK,HOLDLOCK) WHERE MaLopHocPhan = @MaLopHocPhan;
        SELECT @MaNguoi = MaNguoi FROM hoc_thuat.HocVien WITH (UPDLOCK,HOLDLOCK) WHERE MaHocVien = @MaHocVien AND MaPhienBan = @MaPhienBan AND TrangThai = 'DANG_HOC' AND NgayNhapHoc<=CONVERT(date,GETDATE()) AND HanDaoTao >= CONVERT(date,GETDATE());
        IF @MaNguoi IS NULL THROW 51014, N'Lớp không thuộc phiên bản của học viên hoặc học viên không còn được đăng ký.', 1;
        IF (SELECT COUNT(*) FROM hoc_thuat.DangKyHocPhan WHERE MaLopHocPhan = @MaLopHocPhan AND TrangThai <> 'HUY') >= @SiSoToiDa THROW 51015, N'Lớp đã đủ sĩ số.', 1;
        IF EXISTS (SELECT 1 FROM hoc_thuat.HocPhanTienQuyet q JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan = q.MaPhienBan
            WHERE q.MaPhienBan = @MaPhienBan AND q.MaHocPhan = @MaHocPhan
            AND NOT EXISTS (SELECT 1 FROM hoc_thuat.v_KetQuaHocPhan k WHERE k.MaHocVien = @MaHocVien AND k.MaHocPhan = q.MaHocPhanTienQuyet AND k.DiemTotNhat >= p.DiemDatHocPhan))
            THROW 51016, N'Chưa đạt học phần tiên quyết.', 1;
        IF EXISTS (SELECT 1 FROM hoc_thuat.DangKyHocPhan d JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan = d.MaLopHocPhan WHERE d.MaHocVien = @MaHocVien AND l.MaHocPhan = @MaHocPhan AND d.TrangThai = 'DANG_HOC')
            THROW 51017, N'Đang học học phần này ở một lớp khác.', 1;
        INSERT hoc_thuat.DangKyHocPhan(MaHocVien,MaLopHocPhan) VALUES (@MaHocVien,@MaLopHocPhan);
        INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien) VALUES ('HOC_THUAT','HocVien',@MaHocVien,'DANG_KY_HOC_PHAN',@MaNguoi);
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;
        THROW;
    END CATCH;
END;

GO

GO

GO


CREATE OR ALTER PROCEDURE hoc_thuat.usp_ChotDiem
    @MaDangKy bigint,@DiemTongKet decimal(4,2),@MaCanBoXacNhan bigint
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @MaNguoi bigint;
        SELECT @MaNguoi=MaNguoi FROM nhan_su.CanBo WHERE MaCanBo=@MaCanBoXacNhan AND DangHoatDong=1;
        IF @MaNguoi IS NULL OR @DiemTongKet IS NULL OR @DiemTongKet NOT BETWEEN 0 AND 10 THROW 51070,N'Cán bộ hoặc điểm không hợp lệ.',1;
        IF NOT EXISTS (SELECT 1 FROM hoc_thuat.DangKyHocPhan d WITH (UPDLOCK,HOLDLOCK)
            JOIN hoc_thuat.HocVien h WITH (HOLDLOCK) ON h.MaHocVien=d.MaHocVien
            WHERE d.MaDangKy=@MaDangKy AND d.TrangThai='DANG_HOC' AND d.DaKhoaDiem=0 AND h.TrangThai='DANG_HOC') THROW 51071,N'Đăng ký không còn mở, điểm đã khóa hoặc học viên không đang học.',1;
        UPDATE hoc_thuat.DangKyHocPhan SET DiemTongKet=@DiemTongKet,DaKhoaDiem=1,TrangThai='HOAN_THANH' WHERE MaDangKy=@MaDangKy;
        INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet)
        VALUES ('HOC_THUAT','DangKyHocPhan',@MaDangKy,'CHOT_DIEM',@MaNguoi,(SELECT @DiemTongKet AS DiemTongKet FOR JSON PATH,WITHOUT_ARRAY_WRAPPER));
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()<>0 ROLLBACK;
        THROW;
    END CATCH;
END;

GO

CREATE OR ALTER PROCEDURE hoc_thuat.usp_DieuChinhDiem
    @MaDangKy bigint,@DiemMoi decimal(4,2),@LyDo nvarchar(2000),@SoQuyetDinh nvarchar(100),@MaCanBoPheDuyet bigint
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @DiemCu decimal(4,2),@MaNguoi bigint;
        SELECT @DiemCu=d.DiemTongKet FROM hoc_thuat.DangKyHocPhan d WITH (UPDLOCK,HOLDLOCK)
        JOIN hoc_thuat.HocVien h WITH (HOLDLOCK) ON h.MaHocVien=d.MaHocVien
        WHERE d.MaDangKy=@MaDangKy AND d.DaKhoaDiem=1 AND h.TrangThai<>'TOT_NGHIEP';
        SELECT @MaNguoi=MaNguoi FROM nhan_su.CanBo WHERE MaCanBo=@MaCanBoPheDuyet AND DangHoatDong=1;
        IF @DiemCu IS NULL OR @MaNguoi IS NULL OR @DiemMoi IS NULL OR @DiemMoi NOT BETWEEN 0 AND 10
            OR NULLIF(LTRIM(RTRIM(@LyDo)),N'') IS NULL OR NULLIF(LTRIM(RTRIM(@SoQuyetDinh)),N'') IS NULL
            THROW 51072,N'Không thể điều chỉnh: kiểm tra điểm khóa, trạng thái tốt nghiệp, lý do và quyết định.',1;
        UPDATE hoc_thuat.DangKyHocPhan SET DiemTongKet=@DiemMoi WHERE MaDangKy=@MaDangKy;
        INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet)
        VALUES ('HOC_THUAT','DangKyHocPhan',@MaDangKy,'DIEU_CHINH_DIEM',@MaNguoi,(SELECT @DiemCu AS DiemCu,@DiemMoi AS DiemMoi,@LyDo AS LyDo,@SoQuyetDinh AS SoQuyetDinh FOR JSON PATH,WITHOUT_ARRAY_WRAPPER));
        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()<>0 ROLLBACK;
        THROW;
    END CATCH;
END;

GO

CREATE OR ALTER TRIGGER hoc_thuat.trg_DangKyDungPhienBan ON hoc_thuat.DangKyHocPhan AFTER INSERT,UPDATE AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted i JOIN hoc_thuat.HocVien h ON h.MaHocVien=i.MaHocVien JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan=i.MaLopHocPhan WHERE h.MaPhienBan<>l.MaPhienBan)
        THROW 51073,N'Học viên và lớp học phần phải cùng phiên bản chương trình.',1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.MaDangKy=i.MaDangKy WHERE i.MaHocVien<>d.MaHocVien OR i.MaLopHocPhan<>d.MaLopHocPhan)
        THROW 51073,N'Không chuyển đăng ký đã tạo sang học viên hoặc lớp khác.',1;
END;

GO
