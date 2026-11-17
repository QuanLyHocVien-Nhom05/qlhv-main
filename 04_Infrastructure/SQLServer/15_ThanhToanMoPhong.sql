-- QR đồ án: không có lệnh chuyển khoản, không được tính vào doanh thu thật.
IF COL_LENGTH('tuyen_sinh.GiaoDich','LaMoPhong') IS NULL
 ALTER TABLE tuyen_sinh.GiaoDich ADD LaMoPhong bit NOT NULL CONSTRAINT DF_GiaoDich_LaMoPhong DEFAULT 0;
GO
IF COL_LENGTH('tuyen_sinh.GiaoDich','HanThanhToan') IS NULL
 ALTER TABLE tuyen_sinh.GiaoDich ADD HanThanhToan datetime2 NULL;
IF COL_LENGTH('tuyen_sinh.GiaoDich','KetQuaMoPhong') IS NULL
 ALTER TABLE tuyen_sinh.GiaoDich ADD KetQuaMoPhong varchar(20) NULL;
GO
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('tuyen_sinh.GiaoDich') AND name='CK_GiaoDich_Kenh')
 ALTER TABLE tuyen_sinh.GiaoDich DROP CONSTRAINT CK_GiaoDich_Kenh;
ALTER TABLE tuyen_sinh.GiaoDich WITH CHECK ADD CONSTRAINT CK_GiaoDich_Kenh CHECK(Kenh IN('VNPAY','MOMO','NGAN_HANG','MO_PHONG'));
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('tuyen_sinh.GiaoDich') AND name='CK_GiaoDich_MoPhong')
 ALTER TABLE tuyen_sinh.GiaoDich WITH CHECK ADD CONSTRAINT CK_GiaoDich_MoPhong CHECK(
  (LaMoPhong=0 AND Kenh<>'MO_PHONG' AND KetQuaMoPhong IS NULL)
  OR (LaMoPhong=1 AND Kenh='MO_PHONG' AND HanThanhToan IS NOT NULL AND
   ((TrangThai='CHO_TT' AND KetQuaMoPhong IS NULL)
   OR (TrangThai='DA_TT' AND KetQuaMoPhong IS NOT NULL AND KetQuaMoPhong='THANH_CONG')
   OR (TrangThai='THAT_BAI' AND KetQuaMoPhong IS NOT NULL AND KetQuaMoPhong IN('THAT_BAI','HET_HAN')))));
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tuyen_sinh.GiaoDich') AND name='UX_GiaoDich_MoPhongCho')
 CREATE UNIQUE INDEX UX_GiaoDich_MoPhongCho ON tuyen_sinh.GiaoDich(MaHoSo,LoaiPhi)
 WHERE Kenh='MO_PHONG' AND TrangThai='CHO_TT';
GO
