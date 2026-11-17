import {Resource} from '../../management/domain/resource';

// Dùng cùng một điều kiện cho mở thủ công và hàng đợi theo lịch.
export const readyBatch = `EXISTS(SELECT 1 FROM tuyen_sinh.ChiTieu q WHERE q.MaDot=d.MaDot)
 AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.ChiTieu q WHERE q.MaDot=d.MaDot AND
 (q.QuyTacDaXacNhan=0 OR q.DuKien=1 OR q.PhuongThuc='CHUNG' OR q.LePhi IS NULL
 OR q.PhiNhapHoc IS NULL OR q.GpaToiThieu IS NULL OR q.HeSoCoSo IS NULL
 OR q.HeSoChuyenNganh IS NULL OR q.HeSoNgoaiNgu IS NULL OR q.HeSoUuTien IS NULL
 OR q.DiemSan IS NULL OR q.TieuChiPhu IS NULL))`;

export function addAdmissionSchedule(resources:Resource[]){
 const batch=resources.find(r=>r.key==='admission-batches')!;
 batch.query=batch.query.replace('d.CongBoDiem,','d.CongBoDiem,d.TuDongTheoLich,');
 batch.columns.push('TuDongTheoLich');
 const open=batch.actions!.find(a=>a.key==='open')!;
 open.sql=`UPDATE d SET TrangThai='DANG_MO',TuDongTheoLich=1,MaNguoiLapLich=@Nguoi
 FROM tuyen_sinh.DotTuyen d WITH(UPDLOCK,HOLDLOCK)
 WHERE d.MaDot=@Id AND d.TrangThai='NHAP' AND d.MoHoSo<=SYSUTCDATETIME()
 AND d.DongHoSo>SYSUTCDATETIME() AND ${readyBatch};
 IF @@ROWCOUNT<>1 THROW 51091,N'Chỉ mở trong lịch nhận hồ sơ, khi đợt còn nháp và mọi chỉ tiêu đã xác nhận đủ quy tắc. Dùng lên lịch nếu chưa đến ngày mở.',1;`;
 batch.actions!.push(
  {key:'schedule',label:'Tự mở/đóng theo lịch',fields:[],sql:`UPDATE d SET TuDongTheoLich=1,MaNguoiLapLich=@Nguoi
   FROM tuyen_sinh.DotTuyen d WITH(UPDLOCK,HOLDLOCK)
   WHERE d.MaDot=@Id AND d.TrangThai='NHAP' AND d.DongHoSo>SYSUTCDATETIME() AND ${readyBatch};
   IF @@ROWCOUNT<>1 THROW 51091,N'Đợt phải còn nháp, chưa hết hạn và chỉ tiêu đã đủ quy tắc được xác nhận.',1;`},
  {key:'cancel-schedule',label:'Hủy lịch mở tự động',fields:[],sql:`UPDATE tuyen_sinh.DotTuyen SET TuDongTheoLich=0
   WHERE MaDot=@Id AND TrangThai='NHAP' AND TuDongTheoLich=1;
   IF @@ROWCOUNT<>1 THROW 51091,N'Chỉ hủy lịch khi đợt chưa mở.',1;`},
 );
}

export const processBatchSchedule = `SET XACT_ABORT ON;
BEGIN TRY BEGIN TRANSACTION;
DECLARE @Changes TABLE(MaDot int,HanhDong varchar(40),MaNguoi bigint);
UPDATE d SET TrangThai='DANG_MO' OUTPUT inserted.MaDot,'TU_DONG_MO_DOT',inserted.MaNguoiLapLich INTO @Changes
 FROM tuyen_sinh.DotTuyen d WITH(UPDLOCK,READPAST,ROWLOCK)
 WHERE d.TrangThai='NHAP' AND d.TuDongTheoLich=1 AND d.MaNguoiLapLich IS NOT NULL AND d.MoHoSo<=SYSUTCDATETIME()
 AND d.DongHoSo>SYSUTCDATETIME() AND ${readyBatch};
UPDATE tuyen_sinh.DotTuyen WITH(UPDLOCK,READPAST,ROWLOCK)
 SET TrangThai='DA_DONG',TuDongTheoLich=0 OUTPUT inserted.MaDot,'TU_DONG_DONG_DOT',inserted.MaNguoiLapLich INTO @Changes
 WHERE DongHoSo<=SYSUTCDATETIME() AND TuDongTheoLich=1 AND MaNguoiLapLich IS NOT NULL AND TrangThai IN('DANG_MO','NHAP');
INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet)
 SELECT 'TUYEN_SINH','DotTuyen',MaDot,HanhDong,MaNguoi,N'{"TuDong":true,"MuiGio":"UTC","GhiChu":"Tác vụ nền thực hiện theo lịch do tài khoản cấu hình, không phải thao tác đăng nhập trực tiếp."}' FROM @Changes;
SELECT MaDot,HanhDong FROM @Changes;
COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`;
