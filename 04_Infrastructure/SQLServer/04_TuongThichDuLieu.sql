-- Upgrade an existing installation without deleting historical business data.
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
GO
IF COL_LENGTH(N'hoc_thuat.HocVien',N'MaHoSo') IS NOT NULL
BEGIN
 DECLARE @Khoa sysname,@Lenh nvarchar(max);
 SELECT @Khoa=k.name FROM sys.key_constraints k
 JOIN sys.index_columns i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id
 JOIN sys.columns c ON c.object_id=i.object_id AND c.column_id=i.column_id
 WHERE k.parent_object_id=OBJECT_ID(N'hoc_thuat.HocVien') AND k.type='UQ' AND c.name=N'MaHoSo';
 IF @Khoa IS NOT NULL BEGIN SET @Lenh=N'ALTER TABLE hoc_thuat.HocVien DROP CONSTRAINT '+QUOTENAME(@Khoa);EXEC(@Lenh);END;
 IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'hoc_thuat.HocVien') AND name=N'MaHoSo' AND is_nullable=0)
  EXEC(N'ALTER TABLE hoc_thuat.HocVien ALTER COLUMN MaHoSo bigint NULL');
 IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'hoc_thuat.HocVien') AND name=N'UX_HocVien_HoSoCu')
  EXEC(N'CREATE UNIQUE INDEX UX_HocVien_HoSoCu ON hoc_thuat.HocVien(MaHoSo) WHERE MaHoSo IS NOT NULL');
END;
GO
