export const examLock=`DECLARE @Lock int;EXEC @Lock=sys.sp_getapplock @Resource=N'TS_PHAN_PHONG',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=5000;IF @Lock<0 THROW 51091,N'Đang cập nhật lịch. Thử lại sau.',1;`;
export const allocateCandidatesSql=`
 DECLARE @Dot int,@Seats int,@Occupied int,@Part varchar(20),@ExamQuota int,@Format varchar(20);
 SELECT @Dot=c.MaDot,@Seats=p.SucChua,@Part=c.ThanhPhan,@ExamQuota=c.MaChiTieu,@Format=c.HinhThuc FROM tuyen_sinh.CaThi c WITH(UPDLOCK,HOLDLOCK) JOIN tuyen_sinh.PhongThi p ON p.MaPhong=c.MaPhong WHERE c.MaCa=@Id AND c.TrangThai='NHAP';
 IF @Dot IS NULL THROW 51091,N'Ca phải còn nháp.',1;
 IF @Quota IS NOT NULL AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.ChiTieu WHERE MaChiTieu=@Quota AND MaDot=@Dot) THROW 51091,N'Chỉ tiêu khác đợt.',1;
 SELECT @Occupied=COUNT(*) FROM tuyen_sinh.PhanPhong WHERE MaCa=@Id;
 INSERT tuyen_sinh.PhanPhong(MaHoSo,MaCa,SoBaoDanh,MaPhach,ThanhPhan)
 SELECT TOP(CASE WHEN @Seats>@Occupied THEN @Seats-@Occupied ELSE 0 END) h.MaHoSo,@Id,
 COALESCE((SELECT TOP(1) old.SoBaoDanh FROM tuyen_sinh.PhanPhong old WHERE old.MaHoSo=h.MaHoSo),
 REPLACE(REPLACE(REPLACE(REPLACE(d.MauSoBaoDanh,'{DOT}',d.KyHieu),'{NGANH}',CONVERT(varchar(20),q.MaNganh)),'{NAM}',CONVERT(varchar(4),YEAR(d.MoHoSo))),'{SO}',CASE WHEN LEN(CONVERT(varchar(20),h.MaHoSo))>=d.DoDaiSoBaoDanh THEN CONVERT(varchar(20),h.MaHoSo) ELSE RIGHT(REPLICATE('0',d.DoDaiSoBaoDanh)+CONVERT(varchar(20),h.MaHoSo),d.DoDaiSoBaoDanh) END)),CONVERT(varchar(36),NEWID()),@Part
 FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=q.MaDot JOIN danh_muc.Nganh n ON n.MaNganh=q.MaNganh
 WHERE q.MaDot=@Dot AND(@Quota IS NULL OR q.MaChiTieu=@Quota) AND(@ExamQuota IS NULL OR q.MaChiTieu=@ExamQuota) AND(@Format<>'DE_CUONG' OR q.TrinhDo='TIEN_SI') AND h.TrangThai='DU_DIEU_KIEN'
 AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.PhanPhong p WHERE p.MaHoSo=h.MaHoSo AND(p.ThanhPhan=@Part OR p.ThanhPhan='TONG_HOP' OR @Part='TONG_HOP'))
 AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.PhanPhong a JOIN tuyen_sinh.CaThi other ON other.MaCa=a.MaCa JOIN tuyen_sinh.CaThi currentExam ON currentExam.MaCa=@Id WHERE a.MaHoSo=h.MaHoSo AND other.TrangThai<>'HUY' AND other.BatDau<currentExam.KetThuc AND other.KetThuc>currentExam.BatDau)
 AND(@Admin=1 OR n.MaDonVi IN(SELECT MaDonVi FROM nhan_su.fn_PhamViDonVi(@Subject))) ORDER BY h.MaHoSo;
 SET @Added=@@ROWCOUNT;
`;
export const validCouncilSql=`
 IF NOT EXISTS(SELECT 1 FROM tuyen_sinh.CaThi c JOIN tuyen_sinh.HoiDong h ON h.MaHoiDong=c.MaHoiDong AND h.MaDot=c.MaDot WHERE c.MaCa=@Id AND h.TrangThai='DA_DUYET' AND(h.Loai='DE_CUONG' AND c.HinhThuc='DE_CUONG' OR h.Loai<>'DE_CUONG' AND c.HinhThuc<>'DE_CUONG')) THROW 51091,N'Cần liên kết hội đồng đã duyệt, đúng đợt và loại đánh giá.',1;
 IF EXISTS(SELECT 1 FROM tuyen_sinh.PhanCong p JOIN tuyen_sinh.CaThi c ON c.MaCa=p.MaCa WHERE p.MaCa=@Id AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.ThanhVienHoiDong t WHERE t.MaHoiDong=c.MaHoiDong AND t.MaCanBo=p.MaCanBo AND t.VaiTro=p.VaiTro)) THROW 51091,N'Phân công ca phải thuộc thành viên và nhiệm vụ của hội đồng.',1;
 IF EXISTS(SELECT 1 FROM tuyen_sinh.ThanhVienHoiDong t JOIN tuyen_sinh.CaThi c ON c.MaHoiDong=t.MaHoiDong JOIN nhan_su.CanBo b ON b.MaCanBo=t.MaCanBo WHERE c.MaCa=@Id AND b.DangHoatDong=0) THROW 51091,N'Thành viên hội đồng đã ngừng hoạt động.',1;
`;
