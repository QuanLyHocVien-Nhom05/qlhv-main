SET XACT_ABORT ON;
IF NOT EXISTS(SELECT 1 FROM danh_muc.DonVi)
 INSERT danh_muc.DonVi(KyHieu,TenDonVi) VALUES('DON_VI_QUAN_LY',N'Đơn vị quản lý');
IF NOT EXISTS(SELECT 1 FROM danh_muc.Nganh)
 INSERT danh_muc.Nganh(KyHieu,TenNganh,MaDonVi) SELECT TOP(1) 'CNTT',N'Công nghệ thông tin',MaDonVi FROM danh_muc.DonVi ORDER BY MaDonVi;
IF NOT EXISTS(SELECT 1 FROM nhan_su.CanBo)
BEGIN
 INSERT danh_muc.Nguoi(HoTen) VALUES(N'Cán bộ quản trị');
 DECLARE @Nguoi bigint=SCOPE_IDENTITY();
 INSERT nhan_su.CanBo(MaNguoi,MaDonVi,HocVi) SELECT TOP(1) @Nguoi,MaDonVi,'TIEN_SI' FROM danh_muc.DonVi ORDER BY MaDonVi;
END;
GO
