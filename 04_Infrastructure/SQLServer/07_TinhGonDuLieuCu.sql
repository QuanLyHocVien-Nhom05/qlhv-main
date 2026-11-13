-- Chi chay qua scripts/compact-database.cjs --apply sau BACKUP + VERIFYONLY.
-- Khong dua script pha huy nay vao setup:local hay cai dat tu dong.
IF OBJECT_ID(N'tuyen_sinh.DotTuyen',N'U') IS NOT NULL THROW 51900,N'Phan he tuyen sinh dang duoc su dung; khong chay compact-database cu.',1;
SET NOCOUNT ON; SET XACT_ABORT ON; SET QUOTED_IDENTIFIER ON;
IF DB_NAME() IN(N'master',N'model',N'msdb',N'tempdb') THROW 51900,N'Khong duoc tinh gon database he thong.',1;
IF COALESCE(TRY_CONVERT(int,SESSION_CONTEXT(N'ChoPhepTinhGon')),0)<>1
 THROW 51900,N'Hay dung compact-database.cjs --apply de sao luu truoc khi tinh gon.',1;
BEGIN TRY
 BEGIN TRANSACTION;
 DECLARE @Bo TABLE(Ten sysname PRIMARY KEY);
 INSERT @Bo VALUES('tuyen_sinh'),('nghien_cuu'),('tien_do'),('tai_chinh'),('cong_bo'),('tot_nghiep');
 DECLARE @BangBo TABLE(Id int PRIMARY KEY);
 INSERT @BangBo SELECT t.object_id FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
 WHERE s.name IN(SELECT Ten FROM @Bo) OR (s.name='danh_muc' AND t.name='TepTin')
 OR(s.name='he_thong' AND t.name IN('HangDoiEmail','ThongBaoCaNhan'))
 OR(s.name='nhan_su' AND t.name IN('HoiDong','ThanhVienHoiDong','PhanCongHuongDan'));
 -- Only the obsolete admission link may cross from a retained table.
 IF EXISTS(SELECT 1 FROM sys.foreign_keys f JOIN sys.foreign_key_columns c ON c.constraint_object_id=f.object_id
 WHERE f.referenced_object_id IN(SELECT Id FROM @BangBo) AND f.parent_object_id NOT IN(SELECT Id FROM @BangBo)
 AND NOT(f.parent_object_id=OBJECT_ID(N'hoc_thuat.HocVien') AND COL_NAME(c.parent_object_id,c.parent_column_id)='MaHoSo'))
 THROW 51901,N'Co lien ket ngoai du kien tu bang can giu. Khong xoa du lieu.',1;
 DECLARE @Lenh nvarchar(max)=N'';
 SELECT @Lenh+=N'ALTER TABLE '+QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))+N'.'+QUOTENAME(OBJECT_NAME(parent_object_id))+N' DROP CONSTRAINT '+QUOTENAME(name)+N';'
 FROM sys.foreign_keys WHERE parent_object_id IN(SELECT Id FROM @BangBo) OR referenced_object_id IN(SELECT Id FROM @BangBo);
 IF @Lenh<>N'' EXEC sys.sp_executesql @Lenh;
 -- Remove the unused admission ID; keep the student, person and curriculum IDs.
 IF COL_LENGTH('hoc_thuat.HocVien','MaHoSo') IS NOT NULL BEGIN
  SET @Lenh=N'';
  SELECT @Lenh+=N'DROP INDEX '+QUOTENAME(i.name)+N' ON hoc_thuat.HocVien;'
  FROM sys.indexes i WHERE i.object_id=OBJECT_ID('hoc_thuat.HocVien') AND i.is_primary_key=0 AND i.is_unique_constraint=0
  AND EXISTS(SELECT 1 FROM sys.index_columns c WHERE c.object_id=i.object_id AND c.index_id=i.index_id AND COL_NAME(c.object_id,c.column_id)='MaHoSo');
  IF @Lenh<>N'' EXEC sys.sp_executesql @Lenh;
  ALTER TABLE hoc_thuat.HocVien DROP COLUMN MaHoSo;
 END;
 -- Drop old views and procedures; table-owned triggers disappear with their tables.
 SET @Lenh=N'';
 SELECT @Lenh+=CASE o.type WHEN 'P' THEN N'DROP PROCEDURE ' WHEN 'V' THEN N'DROP VIEW ' ELSE N'DROP FUNCTION ' END+QUOTENAME(s.name)+N'.'+QUOTENAME(o.name)+N';'
 FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id
 WHERE o.type IN('P','V','FN','IF','TF') AND (s.name IN(SELECT Ten FROM @Bo)
 OR(s.name='nhan_su' AND o.name IN('usp_PhanCongHuongDan','usp_PheDuyetHoiDong')));
 IF @Lenh<>N'' EXEC sys.sp_executesql @Lenh;
 SET @Lenh=N'';
 SELECT @Lenh+=N'DROP TABLE '+QUOTENAME(OBJECT_SCHEMA_NAME(Id))+N'.'+QUOTENAME(OBJECT_NAME(Id))+N';' FROM @BangBo;
 IF @Lenh<>N'' EXEC sys.sp_executesql @Lenh;
 SET @Lenh=N'';
 SELECT @Lenh+=N'DROP SCHEMA '+QUOTENAME(s.name)+N';' FROM sys.schemas s WHERE s.name IN(SELECT Ten FROM @Bo);
 IF @Lenh<>N'' EXEC sys.sp_executesql @Lenh;
 COMMIT;
 SELECT COUNT(*) AS SoBangConLai FROM sys.tables WHERE is_ms_shipped=0;
END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;
