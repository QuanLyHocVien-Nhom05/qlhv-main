-- Nâng cấp bổ sung, không xóa hồ sơ hoặc các bảng đào tạo lịch sử.
IF COL_LENGTH('tuyen_sinh.DotTuyen','TuDongTheoLich') IS NULL
    ALTER TABLE tuyen_sinh.DotTuyen ADD TuDongTheoLich bit NOT NULL
        CONSTRAINT DF_DotTuyen_TuDongTheoLich DEFAULT 0;
GO
IF COL_LENGTH('tuyen_sinh.DotTuyen','MaNguoiLapLich') IS NULL
    ALTER TABLE tuyen_sinh.DotTuyen ADD MaNguoiLapLich bigint NULL
        CONSTRAINT FK_DotTuyen_NguoiLapLich REFERENCES danh_muc.Nguoi(MaNguoi);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tuyen_sinh.DotTuyen') AND name='IX_DotTuyen_Lich')
    CREATE INDEX IX_DotTuyen_Lich ON tuyen_sinh.DotTuyen(TrangThai,TuDongTheoLich,MoHoSo,DongHoSo);
GO
IF COL_LENGTH('danh_muc.Nganh','MaNganhCha') IS NULL
    ALTER TABLE danh_muc.Nganh ADD MaNganhCha int NULL
        CONSTRAINT FK_Nganh_NganhCha REFERENCES danh_muc.Nganh(MaNganh);
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_Nganh_KhongTuLamCha' AND parent_object_id=OBJECT_ID('danh_muc.Nganh'))
    ALTER TABLE danh_muc.Nganh ADD CONSTRAINT CK_Nganh_KhongTuLamCha
        CHECK(MaNganhCha IS NULL OR MaNganhCha<>MaNganh);
GO
