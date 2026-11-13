import { Controller,Get,Module,NotFoundException,Param,ParseIntPipe,Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SqlServerService } from '../../shared/infrastructure/sql-server.service';
import { PageDto } from '../management/presentation/management.controller';
const projection=`SELECT c.MaChuongTrinh,c.KyHieu,c.TenChuongTrinh,c.TrinhDo,n.TenNganh,d.TenDonVi,
  p.MaPhienBan,p.SoPhienBan,p.KhoaTuyenSinh,COALESCE(p.TinChiToiThieu,c.SoTinChiCongBo) AS TinChiToiThieu,p.ThoiGianToiDaThang,
  c.ThoiGianChuanThang,c.NguonUrl,c.BanSaoUrl,c.MoTaNguon,c.KhungCongKhai
  FROM hoc_thuat.ChuongTrinh c JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh
  JOIN danh_muc.DonVi d ON d.MaDonVi=n.MaDonVi
  OUTER APPLY (SELECT TOP(1) v.* FROM hoc_thuat.PhienBanChuongTrinh v WHERE v.MaChuongTrinh=c.MaChuongTrinh AND v.TrangThai='DA_DUYET' ORDER BY v.SoPhienBan DESC) p
  WHERE p.MaPhienBan IS NOT NULL OR(c.HienThiCongKhai=1 AND c.NguonUrl IS NOT NULL)`;
@ApiTags('public') @Controller('public')
class PublicController {
  constructor(private readonly db:SqlServerService) {}
  @Get('programs') async programs(@Query() query:PageDto) {
    const filter=`(@Search=N'' OR TenChuongTrinh LIKE @Pattern ESCAPE N'~' OR TenNganh LIKE @Pattern ESCAPE N'~' OR KyHieu LIKE @Pattern ESCAPE N'~')`;
    const result=await this.db.query(`SELECT COUNT(*) AS Total FROM (${projection}) p WHERE ${filter};
      SELECT * FROM (${projection}) p WHERE ${filter} ORDER BY MaChuongTrinh DESC OFFSET CAST(@Offset AS int) ROWS FETCH NEXT CAST(@Limit AS int) ROWS ONLY`,
      {Search:query.search,Pattern:`%${query.search.replace(/[~%_\[]/g,'~$&')}%`,Offset:(query.page-1)*query.limit,Limit:query.limit});
    const sets=result.recordsets as unknown as Record<string,unknown>[][];
    return {data:sets[1].map(({KhungCongKhai,...row})=>row),total:sets[0][0].Total,page:query.page,limit:query.limit};
  }
  @Get('programs/:id') async detail(@Param('id',ParseIntPipe) id:number) {
    const result=await this.db.query(`SELECT * FROM (${projection}) p WHERE MaChuongTrinh=@Id`,{Id:id});
    const program=result.recordset[0];if(!program)throw new NotFoundException('Chương trình chưa công bố hoặc không tồn tại.');
    const {KhungCongKhai,...info}=program;
    if(!program.MaPhienBan)return {...info,HocPhan:JSON.parse(String(KhungCongKhai??'[]'))};
    const courses=await this.db.query(`SELECT h.KyHieu,k.TenHocPhan,k.SoTinChi,k.HocKyDuKien,k.BatBuoc
      FROM hoc_thuat.KhungHocPhan k JOIN hoc_thuat.HocPhan h ON h.MaHocPhan=k.MaHocPhan
      WHERE k.MaPhienBan=@Version ORDER BY k.HocKyDuKien,h.KyHieu`,{Version:program.MaPhienBan});
    return {...info,HocPhan:courses.recordset};
  }
  @Get('admission-announcements') async announcements(){return(await this.db.query(`SELECT d.MaDot,d.TenDot,d.SoVanBan,d.NgayBanHanh,d.DongHoSo,d.NgayCongBo,d.NhapHocDuKien,d.GhiChuNguon,d.NgayKiemChung,d.KieuKiemChung,d.NguonUrl,d.BanSaoUrl,d.TrangThai,c.MaChiTieu,c.PhuongThuc,c.SoLuong,c.DuKien,c.PhiDangKy,c.PhiXetTuyen,n.KyHieu AS MaNganh,n.TenNganh FROM tuyen_sinh.DotTuyen d JOIN tuyen_sinh.ChiTieu c ON c.MaDot=d.MaDot JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh WHERE d.NguonUrl IS NOT NULL ORDER BY d.NgayBanHanh DESC,n.KyHieu`)).recordset;}
}
@Module({controllers:[PublicController]})
export class PublicModule {}
