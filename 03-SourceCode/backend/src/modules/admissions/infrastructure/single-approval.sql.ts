// One transaction rechecks eligibility instead of trusting the preview or client flags.
export const singleApprovalSql=`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;
 IF NOT EXISTS(SELECT 1 FROM tuyen_sinh.QuyenDuyet WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoi=@Actor AND CapDuyet=0) THROW 51203,N'Chưa được Admin giao quyền duyệt một cấp.',1;
 IF NOT EXISTS(SELECT 1 FROM tuyen_sinh.DotTuyen WITH(UPDLOCK,HOLDLOCK) WHERE MaDot=@Dot AND TrangThai='CHO_DUYET' AND CongBoDiem=1 AND SYSUTCDATETIME()>=HanPhucKhao AND SYSUTCDATETIME()>=DongHoSo) THROW 51091,N'Đợt chưa đủ điều kiện duyệt hoặc kết quả đã khóa.',1;
 IF EXISTS(SELECT 1 FROM tuyen_sinh.TrinhDuyet WHERE MaDot=@Dot AND CapDuyet=0) THROW 51091,N'Đợt đã được duyệt một cấp.',1;
 IF EXISTS(SELECT 1 FROM tuyen_sinh.PhucKhao p JOIN tuyen_sinh.HoSo h ON h.MaHoSo=p.MaHoSo JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu WHERE q.MaDot=@Dot AND p.TrangThai='CHO_XU_LY') THROW 51091,N'Còn phúc khảo chưa xử lý.',1;
 IF EXISTS(SELECT 1 FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu LEFT JOIN tuyen_sinh.KetQua k WITH(UPDLOCK,HOLDLOCK) ON k.MaHoSo=h.MaHoSo WHERE q.MaDot=@Dot AND h.TrangThai='DU_DIEU_KIEN' AND(k.MaHoSo IS NULL OR k.XepHang IS NULL OR k.DuKienTrungTuyen IS NULL)) THROW 51091,N'Còn hồ sơ chưa có điểm hoặc chưa xếp hạng.',1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@Rows) WITH(id bigint,version varchar(18)) j LEFT JOIN tuyen_sinh.KetQua k ON k.MaHoSo=j.id WHERE k.MaHoSo IS NULL OR k.Revision<>TRY_CONVERT(binary(8),j.version,1)) THROW 51091,N'Điểm/xếp hạng đã thay đổi. Tải lại trước khi duyệt.',1;
 IF EXISTS(SELECT q.MaChiTieu FROM tuyen_sinh.ChiTieu q JOIN tuyen_sinh.HoSo h ON h.MaChiTieu=q.MaChiTieu JOIN tuyen_sinh.KetQua k ON k.MaHoSo=h.MaHoSo WHERE q.MaDot=@Dot AND h.TrangThai='DU_DIEU_KIEN' AND k.DuKienTrungTuyen=1 GROUP BY q.MaChiTieu,q.SoLuong HAVING COUNT(*)>q.SoLuong) THROW 51091,N'Danh sách vượt chỉ tiêu.',1;
 INSERT tuyen_sinh.TrinhDuyet(MaDot,CapDuyet,MaNguoi,GhiChu,DiaChiIP) VALUES(@Dot,0,@Actor,@Note,@IP);
 UPDATE tuyen_sinh.DotTuyen SET TrangThai='CONG_BO' WHERE MaDot=@Dot;
 UPDATE h SET TrangThai=CASE WHEN k.DuKienTrungTuyen=1 THEN 'TRUNG_TUYEN' ELSE 'KHONG_TRUNG_TUYEN' END FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.KetQua k ON k.MaHoSo=h.MaHoSo WHERE q.MaDot=@Dot AND h.TrangThai='DU_DIEU_KIEN';
 INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,DiaChiIP,ChiTiet) VALUES('TUYEN_SINH','DotTuyen',@Dot,'PHE_DUYET_MOT_CAP',@Actor,@IP,@Detail);
 INSERT tuyen_sinh.HangDoiThongBao(MaHoSo,Kenh,SuKien,NoiDungMaHoa) SELECT h.MaHoSo,v.Kenh,'KET_QUA_TUYEN_SINH',@Notice FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu CROSS JOIN(VALUES('EMAIL'),('SMS')) v(Kenh) WHERE q.MaDot=@Dot AND h.TrangThai IN('TRUNG_TUYEN','KHONG_TRUNG_TUYEN');
 COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`;
