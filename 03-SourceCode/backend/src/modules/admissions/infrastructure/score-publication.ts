import type {Resource} from '../../management/domain/resource';

// Executed inside the management repository's audited transaction. Lock the
// batch before checking scores so publication cannot race a score update.
export const publishTemporaryScoresSql=`
 DECLARE @PublicationBatch int;
 SELECT @PublicationBatch=MaDot FROM tuyen_sinh.DotTuyen WITH(UPDLOCK,HOLDLOCK)
 WHERE MaDot=@Id AND CongBoDiem=0 AND TrangThai IN('DANG_MO','DA_DONG');
 IF @PublicationBatch IS NULL THROW 51091,N'Đợt chưa mở, đã công bố điểm hoặc kết quả đã khóa.',1;
 IF NOT EXISTS(SELECT 1 FROM he_thong.TaiKhoanDangNhap WHERE MaNguoi=@Nguoi AND VaiTro='ADMIN')
 AND (NOT EXISTS(SELECT 1 FROM tuyen_sinh.ChiTieu WHERE MaDot=@PublicationBatch)
 OR EXISTS(SELECT 1 FROM tuyen_sinh.ChiTieu q JOIN danh_muc.Nganh n ON n.MaNganh=q.MaNganh
 WHERE q.MaDot=@PublicationBatch AND n.MaDonVi NOT IN(SELECT MaDonVi FROM nhan_su.fn_PhamViDonVi(@Nguoi))))
 THROW 51203,N'Đợt tuyển sinh ngoài phạm vi đơn vị phụ trách.',1;
 IF EXISTS(SELECT 1 FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu
 WHERE q.MaDot=@PublicationBatch AND h.TrangThai='DU_DIEU_KIEN'
 AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.KetQua k WHERE k.MaHoSo=h.MaHoSo))
 THROW 51091,N'Còn hồ sơ đủ điều kiện chưa nhập điểm.',1;
 UPDATE tuyen_sinh.DotTuyen SET CongBoDiem=1 WHERE MaDot=@PublicationBatch;
`;

export function addScorePublication(resources:Resource[]){
 const batch=resources.find(r=>r.key==='admission-batches')!;
 batch.actions!.find(a=>a.key==='publish-scores')!.sql=publishTemporaryScoresSql;
}
