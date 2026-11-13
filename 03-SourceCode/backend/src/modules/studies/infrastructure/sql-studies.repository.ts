import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SqlServerService } from '../../../shared/infrastructure/sql-server.service';
import type { StudiesRepository } from '../application/studies.service';
import { registrationBlock, type Prerequisite, type StudyClass, type StudyProfile } from '../domain/study';

const profileSql=`SELECT h.MaHocVien,h.MaSoHocVien,h.MaPhienBan,c.TenChuongTrinh,n.TenNganh,p.KhoaTuyenSinh,c.TrinhDo,
  CONVERT(varchar(10),h.NgayNhapHoc,23) AS NgayNhapHoc,CONVERT(varchar(10),h.HanDaoTao,23) AS HanDaoTao,h.TrangThai,
  p.TinChiToiThieu,p.DiemDatHocPhan,p.DiemTrungBinhToiThieu,t.TinChiTichLuy,t.DiemTrungBinh,
  CONVERT(varchar(10),GETDATE(),23) AS NgayHienTai
  FROM hoc_thuat.HocVien h JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=h.MaPhienBan
  JOIN hoc_thuat.ChuongTrinh c ON c.MaChuongTrinh=p.MaChuongTrinh JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh
  JOIN hoc_thuat.v_TienDoHocTap t ON t.MaHocVien=h.MaHocVien`;

@Injectable()
export class SqlStudiesRepository implements StudiesRepository {
  constructor(private readonly db:SqlServerService) {}
  async list(actor:string) {
    return (await this.db.query<StudyProfile>(`${profileSql} WHERE h.MaNguoi=@Nguoi ORDER BY h.NgayNhapHoc DESC,h.MaHocVien DESC`,{Nguoi:actor})).recordset;
  }
  async detail(id:number,actor:string) {
    const profile=(await this.db.query<StudyProfile>(`${profileSql} WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi`,{HocVien:id,Nguoi:actor})).recordset[0];
    if(!profile)throw new NotFoundException('Không tìm thấy hồ sơ học viên của bạn.');
    const result=await this.db.query(`
      SELECT k.MaHocPhan,hp.KyHieu,k.TenHocPhan,k.SoTinChi,k.HocKyDuKien,k.BatBuoc,r.DiemTotNhat
      FROM hoc_thuat.HocVien h JOIN hoc_thuat.KhungHocPhan k ON k.MaPhienBan=h.MaPhienBan
      JOIN hoc_thuat.HocPhan hp ON hp.MaHocPhan=k.MaHocPhan
      LEFT JOIN hoc_thuat.v_KetQuaHocPhan r ON r.MaHocVien=h.MaHocVien AND r.MaHocPhan=k.MaHocPhan
      WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi ORDER BY k.HocKyDuKien,hp.KyHieu;

      SELECT q.MaHocPhan,q.MaHocPhanTienQuyet,hp.KyHieu,k.TenHocPhan,r.DiemTotNhat
      FROM hoc_thuat.HocVien h JOIN hoc_thuat.HocPhanTienQuyet q ON q.MaPhienBan=h.MaPhienBan
      JOIN hoc_thuat.KhungHocPhan k ON k.MaPhienBan=q.MaPhienBan AND k.MaHocPhan=q.MaHocPhanTienQuyet
      JOIN hoc_thuat.HocPhan hp ON hp.MaHocPhan=q.MaHocPhanTienQuyet
      LEFT JOIN hoc_thuat.v_KetQuaHocPhan r ON r.MaHocVien=h.MaHocVien AND r.MaHocPhan=q.MaHocPhanTienQuyet
      WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi ORDER BY hp.KyHieu;

      SELECT l.MaLopHocPhan,l.KyHieu AS KyHieuLop,l.MaHocPhan,hp.KyHieu AS KyHieuHocPhan,k.TenHocPhan,k.SoTinChi,
        l.NamHoc,l.HocKy,n.HoTen AS GiangVien,l.SiSoToiDa,
        (SELECT COUNT(*) FROM hoc_thuat.DangKyHocPhan d WHERE d.MaLopHocPhan=l.MaLopHocPhan AND d.TrangThai<>'HUY') AS DaDangKy,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM hoc_thuat.DangKyHocPhan d WHERE d.MaHocVien=h.MaHocVien AND d.MaLopHocPhan=l.MaLopHocPhan) THEN 1 ELSE 0 END AS bit) AS DaTungDangKy,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM hoc_thuat.DangKyHocPhan d JOIN hoc_thuat.LopHocPhan other ON other.MaLopHocPhan=d.MaLopHocPhan WHERE d.MaHocVien=h.MaHocVien AND other.MaHocPhan=l.MaHocPhan AND d.TrangThai='DANG_HOC') THEN 1 ELSE 0 END AS bit) AS DangHocCungHocPhan,
        r.DiemTotNhat
      FROM hoc_thuat.HocVien h JOIN hoc_thuat.LopHocPhan l ON l.MaPhienBan=h.MaPhienBan
      JOIN hoc_thuat.KhungHocPhan k ON k.MaPhienBan=l.MaPhienBan AND k.MaHocPhan=l.MaHocPhan
      JOIN hoc_thuat.HocPhan hp ON hp.MaHocPhan=l.MaHocPhan
      JOIN nhan_su.CanBo cb ON cb.MaCanBo=l.MaGiangVien JOIN danh_muc.Nguoi n ON n.MaNguoi=cb.MaNguoi
      LEFT JOIN hoc_thuat.v_KetQuaHocPhan r ON r.MaHocVien=h.MaHocVien AND r.MaHocPhan=l.MaHocPhan
      WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi ORDER BY l.NamHoc DESC,l.HocKy,l.KyHieu;

      SELECT d.MaDangKy,l.MaLopHocPhan,l.KyHieu AS KyHieuLop,hp.KyHieu AS KyHieuHocPhan,k.TenHocPhan,k.SoTinChi,l.NamHoc,l.HocKy,
        d.NgayDangKy,d.TrangThai,d.DaKhoaDiem,CASE WHEN d.DaKhoaDiem=1 THEN d.DiemTongKet ELSE NULL END AS DiemTongKet
      FROM hoc_thuat.HocVien h JOIN hoc_thuat.DangKyHocPhan d ON d.MaHocVien=h.MaHocVien
      JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan=d.MaLopHocPhan
      JOIN hoc_thuat.KhungHocPhan k ON k.MaPhienBan=l.MaPhienBan AND k.MaHocPhan=l.MaHocPhan
      JOIN hoc_thuat.HocPhan hp ON hp.MaHocPhan=l.MaHocPhan
      WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi ORDER BY l.NamHoc DESC,l.HocKy,d.MaDangKy DESC`,{HocVien:id,Nguoi:actor});
    const sets=result.recordsets as unknown as Record<string,unknown>[][];
    const prerequisites=sets[1] as unknown as Prerequisite[];
    const classes=sets[2] as unknown as StudyClass[];
    return {HocVien:profile,HocPhan:sets[0],TienQuyet:prerequisites,
      LopHocPhan:classes.map(item=>({...item,LyDoKhongTheDangKy:registrationBlock(profile,item,prerequisites)})),DangKy:sets[3]};
  }
  async register(id:number,classId:number,actor:string) {
    const detail=await this.detail(id,actor);
    const item=detail.LopHocPhan.find(value=>Number(value.MaLopHocPhan)===classId);
    if(!item)throw new NotFoundException('Lớp không thuộc chương trình của bạn.');
    if(item.LyDoKhongTheDangKy)throw new ConflictException(item.LyDoKhongTheDangKy);
    // The procedure locks class capacity and the student, and rechecks SQL business rules.
    // Lock class before student, in the same order used by usp_DangKyHocPhan.
    await this.db.query(`SET XACT_ABORT ON;
      BEGIN TRY BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM hoc_thuat.LopHocPhan WITH (UPDLOCK,HOLDLOCK) WHERE MaLopHocPhan=@Lop)
          THROW 51091,N'Lớp học phần không còn tồn tại. Vui lòng cập nhật.',1;
        IF NOT EXISTS (SELECT 1 FROM hoc_thuat.HocVien WITH (UPDLOCK,HOLDLOCK) WHERE MaHocVien=@HocVien AND MaNguoi=@Nguoi AND NgayNhapHoc<=CONVERT(date,GETDATE()))
          THROW 51091,N'Hồ sơ học viên đã thay đổi hoặc chưa đến ngày nhập học.',1;
        EXEC hoc_thuat.usp_DangKyHocPhan @MaHocVien=@HocVien,@MaLopHocPhan=@Lop;
        COMMIT;
      END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{HocVien:id,Lop:classId,Nguoi:actor});
    return {message:'Đăng ký học phần thành công.'};
  }
}
