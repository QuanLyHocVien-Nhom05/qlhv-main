-- Dữ liệu kê khai AGU lưu trong HoSoMaHoa, không thêm cột cá nhân dạng rõ.
-- Giữ nguyên dữ liệu/tài khoản; cho phép minh chứng sơ yếu lý lịch có xác nhận.
DECLARE @Drop nvarchar(max)=N'';
SELECT @Drop=@Drop+N'ALTER TABLE tuyen_sinh.TaiLieu DROP CONSTRAINT '+QUOTENAME(name)+N';'
 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('tuyen_sinh.TaiLieu') AND definition LIKE '%LoaiTaiLieu%';
IF @Drop<>N'' EXEC sys.sp_executesql @Drop;
ALTER TABLE tuyen_sinh.TaiLieu WITH CHECK ADD CONSTRAINT CK_TaiLieu_Loai_AGU
 CHECK(LoaiTaiLieu IN('BANG_DAI_HOC','BANG_DIEM','CHUNG_CHI_NGOAI_NGU','LY_LICH_KHOA_HOC','GIAY_KHAM_SUC_KHOE','DONG_Y_CO_QUAN','SO_YEU_LY_LICH','DE_CUONG'));
GO
