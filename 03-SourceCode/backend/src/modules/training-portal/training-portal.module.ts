import {Body,Controller,Get,HttpException,Module,Post,Req,UseGuards} from '@nestjs/common';
import {Equals,IsEmail,IsString,MaxLength,MinLength} from 'class-validator';
import {Transform} from 'class-transformer';
import {JwtModule} from '@nestjs/jwt';
import type {Request} from 'express';
import {AccessGuard,Roles,ActorRequest} from '../../shared/security/access.guard';
import {SqlServerService} from '../../shared/infrastructure/sql-server.service';
class SubscribeDto{
 @Transform(({value})=>typeof value==='string'?value.trim():value) @IsString() @MinLength(2) @MaxLength(150) HoTen!:string;
 @Transform(({value})=>typeof value==='string'?value.trim().toLowerCase():value) @IsEmail() @MaxLength(254) Email!:string;
 @Transform(({value})=>typeof value==='string'?value.trim():value) @IsString() @MinLength(5) @MaxLength(1000) NoiDung!:string;
 @Equals(true) DongY!:boolean;
}
@Controller('public')
class PortalController{
 private attempts=new Map<string,{count:number;until:number}>();
 constructor(private readonly db:SqlServerService){}
 @Get('documents') async documents(){return(await this.db.query(`SELECT MaVanBan,SoVanBan,TieuDe,PhanLoai,NgayBanHanh,DuongDan,NguonUrl,MaDinhDanhNoiBo,GhiChuNguon,NgayKiemChung,KieuKiemChung FROM he_thong.VanBanCongKhai WHERE TrangThai='CONG_BO' AND (NgayBanHanh IS NULL OR NgayBanHanh<=CONVERT(date,GETDATE())) ORDER BY NgayBanHanh DESC,MaVanBan DESC`)).recordset;}
 @Post('subscribe') async subscribe(@Body() body:SubscribeDto,@Req() req:Request){
  const now=Date.now();for(const [key,value]of this.attempts)if(value.until<now)this.attempts.delete(key);const key=req.ip??'',record=this.attempts.get(key)??{count:0,until:now+900000};if(record.count>=5)throw new HttpException('Bạn đã gửi nhiều yêu cầu; vui lòng thử lại sau.',429);record.count++;this.attempts.set(key,record);
  await this.db.query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;IF NOT EXISTS(SELECT 1 FROM he_thong.DangKyNhanThongTin WITH(UPDLOCK,HOLDLOCK) WHERE Email=@Email) INSERT he_thong.DangKyNhanThongTin(HoTen,Email,NoiDung) VALUES(@HoTen,@Email,@NoiDung);COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{HoTen:body.HoTen.trim(),Email:body.Email,NoiDung:body.NoiDung.trim()});return {message:'Đã ghi nhận đăng ký nhận thông tin của bạn.'};
 }
}
@Controller('my/training') @UseGuards(AccessGuard) @Roles('STUDENT')
class MyTrainingController{
 constructor(private readonly db:SqlServerService){}
 @Get() async overview(@Req() req:ActorRequest){const result=await this.db.query(`
 SELECT d.MaDeTai,h.MaSoHocVien,d.TenDeTai,d.TrangThai,d.BaoCaoTienDo,n.HoTen AS GiangVienHuongDan FROM hoc_thuat.DeTaiHocVien d JOIN hoc_thuat.HocVien h ON h.MaHocVien=d.MaHocVien JOIN nhan_su.CanBo c ON c.MaCanBo=d.MaGVHD JOIN danh_muc.Nguoi n ON n.MaNguoi=c.MaNguoi WHERE h.MaNguoi=@Nguoi;
 SELECT b.MaHoiDong,d.TenDeTai,b.NgayBaoVe,b.DiaDiem,b.TrangThai,b.DiemBaoVe,b.NhanXet FROM hoc_thuat.HoiDongBaoVe b JOIN hoc_thuat.DeTaiHocVien d ON d.MaDeTai=b.MaDeTai JOIN hoc_thuat.HocVien h ON h.MaHocVien=d.MaHocVien WHERE h.MaNguoi=@Nguoi;
 SELECT * FROM hoc_thuat.v_DieuKienTotNghiep WHERE MaNguoi=@Nguoi;SELECT h.MaSoHocVien,n.HoTen AS GiangVienHuongDan,p.NgayPhanCong FROM hoc_thuat.PhanCongHuongDan p JOIN hoc_thuat.HocVien h ON h.MaHocVien=p.MaHocVien JOIN nhan_su.CanBo c ON c.MaCanBo=p.MaCanBo JOIN danh_muc.Nguoi n ON n.MaNguoi=c.MaNguoi WHERE h.MaNguoi=@Nguoi;`,{Nguoi:req.actor.sub});const sets=result.recordsets as unknown as Record<string,unknown>[][];return {topics:sets[0],defenses:sets[1],graduation:sets[2],advisors:sets[3]};}
}
@Module({imports:[JwtModule.register({})],controllers:[PortalController,MyTrainingController],providers:[AccessGuard]})
export class TrainingPortalModule{}
