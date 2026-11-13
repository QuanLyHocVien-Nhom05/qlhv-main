-- Remove only reviewed unused fields. No business rows are deleted.
SET XACT_ABORT ON;SET QUOTED_IDENTIFIER ON;
IF DB_NAME() IN(N'master',N'model',N'msdb',N'tempdb') THROW 51900,N'Khong chay tren database he thong.',1;
BEGIN TRY
 BEGIN TRANSACTION;
 DECLARE @Bo TABLE(TenBang nvarchar(200),TenCot sysname,ObjectId int,ColumnId int);
 INSERT @Bo(TenBang,TenCot) VALUES
 (N'danh_muc.Nguoi',N'DiaChi'),
 (N'nhan_su.CanBo',N'HocHam'),(N'nhan_su.CanBo',N'LaCanBoCoHuu'),(N'nhan_su.CanBo',N'SoDeTaiToiDa'),
 (N'hoc_thuat.PhienBanChuongTrinh',N'SoCongBoToiThieu'),
 (N'he_thong.TaiKhoanDangNhap',N'TotpSecret'),(N'he_thong.TaiKhoanDangNhap',N'TotpDraft'),
 (N'he_thong.TaiKhoanDangNhap',N'TotpDraftUntil'),(N'he_thong.TaiKhoanDangNhap',N'TotpCounter');
 UPDATE @Bo SET ObjectId=OBJECT_ID(TenBang,N'U'),ColumnId=COLUMNPROPERTY(OBJECT_ID(TenBang,N'U'),TenCot,'ColumnId');
 DELETE @Bo WHERE ColumnId IS NULL;
 -- Never silently discard an index, relationship, or live module dependency.
 IF EXISTS(SELECT 1 FROM sys.index_columns i JOIN @Bo b ON b.ObjectId=i.object_id AND b.ColumnId=i.column_id)
  THROW 51901,N'Cot cu dang nam trong chi muc; can ra soat truoc khi xoa.',1;
 IF EXISTS(SELECT 1 FROM sys.foreign_key_columns f JOIN @Bo b ON (b.ObjectId=f.parent_object_id AND b.ColumnId=f.parent_column_id) OR(b.ObjectId=f.referenced_object_id AND b.ColumnId=f.referenced_column_id))
  THROW 51901,N'Cot cu dang co khoa ngoai; khong tu dong xoa.',1;
 IF EXISTS(SELECT 1 FROM sys.sql_expression_dependencies d JOIN @Bo b ON b.ObjectId=d.referenced_id AND b.ColumnId=d.referenced_minor_id LEFT JOIN sys.objects o ON o.object_id=d.referencing_id WHERE o.type NOT IN('C','D'))
  THROW 51901,N'Cot cu dang duoc ma SQL su dung; khong tu dong xoa.',1;
 -- Non-schema-bound views/procedures can expose only table-level dependencies
 -- above. Resolve their actual referenced columns before dropping anything.
 DECLARE @Module nvarchar(776);
 DECLARE KiemTraModule CURSOR LOCAL FAST_FORWARD FOR
 SELECT DISTINCT QUOTENAME(OBJECT_SCHEMA_NAME(o.object_id))+N'.'+QUOTENAME(o.name)
 FROM sys.objects o JOIN sys.sql_expression_dependencies d ON d.referencing_id=o.object_id
 JOIN @Bo b ON b.ObjectId=d.referenced_id
 WHERE d.referenced_minor_id=0 AND o.type IN('V','P','FN','IF','TF','TR');
 OPEN KiemTraModule;FETCH NEXT FROM KiemTraModule INTO @Module;
 WHILE @@FETCH_STATUS=0
 BEGIN
  IF EXISTS(SELECT 1 FROM sys.dm_sql_referenced_entities(@Module,N'OBJECT') d JOIN @Bo b ON b.ObjectId=d.referenced_id AND b.ColumnId=d.referenced_minor_id)
   THROW 51901,N'Cot cu dang duoc ma SQL su dung; khong tu dong xoa.',1;
  FETCH NEXT FROM KiemTraModule INTO @Module;
 END;
 CLOSE KiemTraModule;DEALLOCATE KiemTraModule;
 DECLARE @RangBuoc TABLE(Id int PRIMARY KEY,TenBang nvarchar(200),Ten sysname);
 INSERT @RangBuoc SELECT d.object_id,b.TenBang,d.name FROM sys.default_constraints d JOIN @Bo b ON b.ObjectId=d.parent_object_id AND b.ColumnId=d.parent_column_id;
 INSERT @RangBuoc SELECT DISTINCT c.object_id,b.TenBang,c.name FROM sys.check_constraints c JOIN sys.sql_expression_dependencies d ON d.referencing_id=c.object_id JOIN @Bo b ON b.ObjectId=d.referenced_id AND b.ColumnId=d.referenced_minor_id;
 IF EXISTS(SELECT 1 FROM @RangBuoc r JOIN sys.sql_expression_dependencies d ON d.referencing_id=r.Id WHERE d.referenced_minor_id>0 AND NOT EXISTS(SELECT 1 FROM @Bo b WHERE b.ObjectId=d.referenced_id AND b.ColumnId=d.referenced_minor_id))
  THROW 51901,N'Rang buoc dung chung voi cot can giu; khong tu dong xoa.',1;
 DECLARE @Lenh nvarchar(max)=N'';
 SELECT @Lenh+=N'ALTER TABLE '+QUOTENAME(PARSENAME(TenBang,2))+N'.'+QUOTENAME(PARSENAME(TenBang,1))+N' DROP CONSTRAINT '+QUOTENAME(Ten)+N';' FROM @RangBuoc;
 SELECT @Lenh+=N'ALTER TABLE '+QUOTENAME(PARSENAME(TenBang,2))+N'.'+QUOTENAME(PARSENAME(TenBang,1))+N' DROP COLUMN '+QUOTENAME(TenCot)+N';' FROM @Bo;
 IF @Lenh<>N'' EXEC sys.sp_executesql @Lenh;
 COMMIT;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK;
 THROW;
END CATCH;
GO
