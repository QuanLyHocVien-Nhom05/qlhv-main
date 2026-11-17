import {Injectable,NotFoundException} from '@nestjs/common';
import {SqlServerService} from '../../../shared/infrastructure/sql-server.service';
import type {StudiesRepository} from '../application/studies.service';

const profileSql=`SELECT h.MaHocVien,h.MaSoHocVien,h.MaPhienBan,c.TenChuongTrinh,n.TenNganh,p.KhoaTuyenSinh,c.TrinhDo,
 CONVERT(varchar(10),h.NgayNhapHoc,23) AS NgayNhapHoc,h.TrangThai,l.TenLop AS LopQuanLy
 FROM hoc_thuat.HocVien h JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=h.MaPhienBan
 JOIN hoc_thuat.ChuongTrinh c ON c.MaChuongTrinh=p.MaChuongTrinh JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh
 LEFT JOIN hoc_thuat.LopQuanLy l ON l.MaLopQuanLy=h.MaLopQuanLy`;

@Injectable()
export class SqlStudiesRepository implements StudiesRepository{
 constructor(private readonly db:SqlServerService){}
 async list(actor:string){return(await this.db.query(`${profileSql} WHERE h.MaNguoi=@Nguoi ORDER BY h.NgayNhapHoc DESC,h.MaHocVien DESC`,{Nguoi:actor})).recordset;}
 async detail(id:number,actor:string){
  const profile=(await this.db.query(`${profileSql} WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi`,{HocVien:id,Nguoi:actor})).recordset[0];
  if(!profile)throw new NotFoundException('Không tìm thấy thông tin bàn giao của bạn.');
  const result=await this.db.query(`
   SELECT l.MaLopHocPhan,l.KyHieu AS KyHieuLop,k.TenHocPhan,l.NamHoc,l.HocKy,n.HoTen AS GiangVien
   FROM hoc_thuat.HocVien h JOIN hoc_thuat.DangKyHocPhan d ON d.MaHocVien=h.MaHocVien
   JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan=d.MaLopHocPhan
   JOIN hoc_thuat.KhungHocPhan k ON k.MaPhienBan=l.MaPhienBan AND k.MaHocPhan=l.MaHocPhan
   JOIN nhan_su.CanBo cb ON cb.MaCanBo=l.MaGiangVien JOIN danh_muc.Nguoi n ON n.MaNguoi=cb.MaNguoi
   WHERE h.MaHocVien=@HocVien AND h.MaNguoi=@Nguoi AND d.TrangThai<>'HUY'
   ORDER BY l.NamHoc,l.HocKy,l.KyHieu`,{HocVien:id,Nguoi:actor});
  return {HocVien:profile,LopHocPhan:result.recordset};
 }
}
