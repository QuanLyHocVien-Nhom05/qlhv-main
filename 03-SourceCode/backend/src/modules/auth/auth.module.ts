import {sessionRole} from '../../shared/security/roles';
import { Body,Controller,ForbiddenException,Get,HttpCode,HttpException,HttpStatus,Module,Post,Req,UnauthorizedException,UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule,JwtService } from '@nestjs/jwt';
import { IsString,MaxLength,MinLength } from 'class-validator';
import { ApiBearerAuth,ApiProperty,ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SqlServerModule,SqlServerService } from '../../shared/infrastructure/sql-server.service';
import { AccessGuard,type ActorRequest } from '../../shared/security/access.guard';
import { LocalAccountService } from './local-account.service';
class LoginDto {@ApiProperty({maxLength:254}) @IsString() @MaxLength(254) username!:string;@ApiProperty({writeOnly:true,maxLength:200}) @IsString() @MaxLength(200) password!:string;}
class ChangePasswordDto {
  @ApiProperty({writeOnly:true,minLength:1,maxLength:200}) @IsString() @MinLength(1) @MaxLength(200) currentPassword!:string;
  @ApiProperty({writeOnly:true,minLength:8,maxLength:128}) @IsString() @MinLength(8) @MaxLength(128) newPassword!:string;
  @ApiProperty({writeOnly:true,minLength:8,maxLength:128}) @IsString() @MinLength(8) @MaxLength(128) confirmPassword!:string;
}
@ApiTags('auth') @Controller('auth')
class AuthController {
  private readonly attempts=new Map<string,{count:number;until:number}>();
  constructor(private readonly config:ConfigService,private readonly jwt:JwtService,private readonly db:SqlServerService,private readonly accounts:LocalAccountService) {}
  private localOnly(req:Request) {
    if(this.config.get('NODE_ENV')==='production'||this.config.get('DEV_LOGIN_ENABLED')!=='true'||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.ip??''))
      throw new ForbiddenException('Tài khoản cục bộ chỉ được sử dụng trên máy phát triển.');
  }
  private limit(key:string,maximum=5,windowMs=60000) {
    const now=Date.now();
    for(const [name,attempt] of this.attempts)if(attempt.until<=now)this.attempts.delete(name);
    const attempt=this.attempts.get(key)??{count:0,until:now+windowMs};
    if(attempt.count>=maximum)throw new HttpException('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',HttpStatus.TOO_MANY_REQUESTS);
    attempt.count++;this.attempts.set(key,attempt);
  }
  @Post('login') async login(@Body() body:LoginDto,@Req() req:Request) {
    const key=`login:${req.ip}`;this.limit(key);
    const actor=await this.accounts.authenticate(body.username,body.password);
    if(!actor)throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng.');
    if(actor.VaiTro==='ADMIN')this.localOnly(req);
    else if(this.config.get('PASSWORD_LOGIN_ENABLED','true')!=='true')throw new ForbiddenException('Đăng nhập người dùng hiện đang tạm đóng.');
    this.attempts.delete(key);const roles=[sessionRole(actor.VaiTro)];
    const accessToken=await this.jwt.signAsync({sub:String(actor.MaNguoi),roles,authSource:actor.VaiTro==='ADMIN'?'local':'password',credentialVersion:actor.PhienBanMatKhau},{secret:this.config.getOrThrow('JWT_SECRET'),issuer:this.config.getOrThrow('JWT_ISSUER'),audience:this.config.getOrThrow('JWT_AUDIENCE'),expiresIn:'2h',algorithm:'HS256'});
    await this.db.query(`INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,DiaChiIP) VALUES('HE_THONG','TaiKhoanDangNhap',@Id,'DANG_NHAP',@Nguoi,@IP)`,{Id:actor.MaTaiKhoan,Nguoi:actor.MaNguoi,IP:req.ip});
    return {accessToken,user:{id:actor.MaNguoi,name:actor.HoTen,roles,email:actor.ThuDienTu}};
  }
  @Post('logout') @HttpCode(200) @UseGuards(AccessGuard)
  async logout(@Req() req:ActorRequest){await this.db.query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;
    UPDATE he_thong.TaiKhoanDangNhap SET PhienBanMatKhau=PhienBanMatKhau+1 WHERE MaNguoi=@Nguoi AND DaXoa=0;
    INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,DiaChiIP) SELECT 'HE_THONG','TaiKhoanDangNhap',MaTaiKhoan,'DANG_XUAT',MaNguoi,@IP FROM he_thong.TaiKhoanDangNhap WHERE MaNguoi=@Nguoi;
    COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Nguoi:req.actor.sub,IP:req.ip});return {message:'Đã đăng xuất các phiên của tài khoản.'};}
  @Post('change-password') @HttpCode(200) @ApiBearerAuth() @UseGuards(AccessGuard)
  async changePassword(@Body() body:ChangePasswordDto,@Req() req:ActorRequest) {
    if(req.actor.roles.includes('ACADEMIC_ADMIN'))this.localOnly(req);
    const key=`password:${req.actor.sub}`;this.limit(key);
    await this.accounts.changePassword(req.actor.sub,body.currentPassword,body.newPassword,body.confirmPassword);
    this.attempts.delete(key);
    return {message:'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.'};
  }
  @Get('me') @ApiBearerAuth() @UseGuards(AccessGuard) async me(@Req() req:ActorRequest) {
    const result=await this.db.query<{HoTen:string;ThuDienTu:string|null;SoDienThoai:string|null;TenDangNhap:string;NgayTao:string}>(`SELECT n.HoTen,n.ThuDienTu,n.SoDienThoai,n.NgayTao,t.TenDangNhap FROM danh_muc.Nguoi n LEFT JOIN he_thong.TaiKhoanDangNhap t ON t.MaNguoi=n.MaNguoi WHERE n.MaNguoi=@Nguoi`,{Nguoi:req.actor.sub});
    const profile=result.recordset[0];
    return {id:req.actor.sub,name:profile?.HoTen??'Người dùng',email:profile?.ThuDienTu??null,phone:profile?.SoDienThoai??null,username:profile?.TenDangNhap??null,createdAt:profile?.NgayTao??null,roles:req.actor.roles};
  }
}
@Module({imports:[JwtModule.register({}),SqlServerModule],controllers:[AuthController],providers:[AccessGuard,LocalAccountService]})
export class AuthModule {}
