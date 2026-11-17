-- CapDuyet=0 là quyền/phiếu duyệt một cấp. Giữ nguyên lịch sử ba cấp (1..3).
DECLARE @Sql nvarchar(max)=N'';
SELECT @Sql=@Sql+N'ALTER TABLE tuyen_sinh.'+QUOTENAME(OBJECT_NAME(parent_object_id))+N' DROP CONSTRAINT '+QUOTENAME(name)+N';'
 FROM sys.check_constraints WHERE parent_object_id IN(OBJECT_ID('tuyen_sinh.QuyenDuyet'),OBJECT_ID('tuyen_sinh.TrinhDuyet')) AND definition LIKE '%CapDuyet%';
IF @Sql<>N'' EXEC sys.sp_executesql @Sql;
ALTER TABLE tuyen_sinh.QuyenDuyet ADD CONSTRAINT CK_QuyenDuyet_MotCap CHECK(CapDuyet BETWEEN 0 AND 3);
ALTER TABLE tuyen_sinh.TrinhDuyet ADD CONSTRAINT CK_TrinhDuyet_MotCap CHECK(CapDuyet BETWEEN 0 AND 3);
IF COL_LENGTH('tuyen_sinh.TrinhDuyet','DiaChiIP') IS NULL ALTER TABLE tuyen_sinh.TrinhDuyet ADD DiaChiIP varchar(100) NULL;
IF COL_LENGTH('tuyen_sinh.ChiTieu','QuyetDinhHoaDiem') IS NULL ALTER TABLE tuyen_sinh.ChiTieu ADD QuyetDinhHoaDiem nvarchar(max) NULL;
GO
