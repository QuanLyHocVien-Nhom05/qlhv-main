import {Controller,Get,Module,Req,UseGuards} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {AccessGuard,Roles,ActorRequest} from '../../shared/security/access.guard';
import {SqlServerService} from '../../shared/infrastructure/sql-server.service';

@Controller('public')
class PortalController{
 constructor(private readonly db:SqlServerService){}
 @Get('documents') async documents(){return(await this.db.query(`SELECT MaVanBan,SoVanBan,TieuDe,PhanLoai,NgayBanHanh,DuongDan,NguonUrl,MaDinhDanhNoiBo,GhiChuNguon,NgayKiemChung,KieuKiemChung FROM he_thong.VanBanCongKhai WHERE TrangThai='CONG_BO' AND (NgayBanHanh IS NULL OR NgayBanHanh<=CONVERT(date,GETDATE())) ORDER BY NgayBanHanh DESC,MaVanBan DESC`)).recordset;}
}
@Controller('my/training') @UseGuards(AccessGuard) @Roles('STUDENT')
class MyTrainingController{
 constructor(private readonly db:SqlServerService){}
 @Get() async overview(@Req() req:ActorRequest){
  const result=await this.db.query(`SELECT h.MaSoHocVien,n.HoTen AS GiangVienHuongDan,p.NgayPhanCong
   FROM hoc_thuat.PhanCongHuongDan p JOIN hoc_thuat.HocVien h ON h.MaHocVien=p.MaHocVien
   JOIN nhan_su.CanBo c ON c.MaCanBo=p.MaCanBo JOIN danh_muc.Nguoi n ON n.MaNguoi=c.MaNguoi
   WHERE h.MaNguoi=@Nguoi ORDER BY p.NgayPhanCong DESC`,{Nguoi:req.actor.sub});
  return {advisors:result.recordset};
 }
}
@Module({imports:[JwtModule.register({})],controllers:[PortalController,MyTrainingController],providers:[AccessGuard]})
export class TrainingPortalModule{}
