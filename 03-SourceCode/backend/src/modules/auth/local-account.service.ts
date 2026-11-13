import { BadRequestException,ConflictException,ForbiddenException,Injectable,OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqlServerService } from '../../shared/infrastructure/sql-server.service';
import { hashPassword,verifyPassword } from './password';

type Account={MaTaiKhoan:number;MaNguoi:number;MaCanBo:number|null;HoTen:string;ThuDienTu:string|null;TenDangNhap:string;VaiTro:'ADMIN'|'USER'|'LANH_DAO'|'CAN_BO'|'GIANG_VIEN'|'THI_SINH';MatKhauBam:string;PhienBanMatKhau:number};
@Injectable()
export class LocalAccountService implements OnModuleInit {
  constructor(private readonly config:ConfigService,private readonly db:SqlServerService) {}
  async onModuleInit() {
    if(this.config.get('DEV_LOGIN_ENABLED')!=='true'||this.config.get('NODE_ENV')==='production')return;
    const name=this.config.get('DEV_ADMIN_USERNAME','admin');
    const existing=await this.db.query<{MaNguoi:number}>(`SELECT MaNguoi FROM he_thong.TaiKhoanDangNhap WHERE TenDangNhap=@Ten`,{Ten:name});
    if(existing.recordset.length)return;
    const hash=await hashPassword(this.config.getOrThrow<string>('DEV_ADMIN_PASSWORD'));
    await this.db.query(`SET XACT_ABORT ON;
      BEGIN TRY BEGIN TRANSACTION;
      IF NOT EXISTS (SELECT 1 FROM he_thong.TaiKhoanDangNhap WITH (UPDLOCK,HOLDLOCK) WHERE TenDangNhap=@Ten)
      BEGIN
        INSERT he_thong.TaiKhoanDangNhap(MaNguoi,TenDangNhap,MatKhauBam,VaiTro)
        SELECT MaNguoi,@Ten,@Bam,'ADMIN' FROM nhan_su.CanBo WHERE MaCanBo=@CanBo AND DangHoatDong=1;
        IF @@ROWCOUNT<>1 THROW 51090,N'Không tìm thấy cán bộ để khởi tạo tài khoản.',1;
      END;
      COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{Ten:name,Bam:hash,CanBo:Number(this.config.getOrThrow('DEV_CAN_BO_ID'))});
  }
  async authenticate(username:string,password:string):Promise<Account|null> {
    const result=await this.db.query<Account>(`SELECT t.MaTaiKhoan,t.MaNguoi,t.TenDangNhap,t.VaiTro,t.MatKhauBam,t.PhienBanMatKhau,c.MaCanBo,n.HoTen,n.ThuDienTu
      FROM he_thong.TaiKhoanDangNhap t LEFT JOIN nhan_su.CanBo c ON c.MaNguoi=t.MaNguoi JOIN danh_muc.Nguoi n ON n.MaNguoi=t.MaNguoi
      WHERE (t.TenDangNhap=@Ten OR n.ThuDienTu=@Ten) AND t.DangHoatDong=1 AND t.DaXoa=0 AND (t.VaiTro IN('USER','THI_SINH') OR c.DangHoatDong=1)`,{Ten:username.trim()});
    const account=result.recordset[0];
    if(!account){await hashPassword(password);return null;}
    return await verifyPassword(password,account.MatKhauBam)?account:null;
  }
  async changePassword(subject:string,currentPassword:string,newPassword:string,confirmation:string) {
    if(newPassword!==confirmation)throw new BadRequestException('Xác nhận mật khẩu mới không khớp.');
    if(newPassword.trim().length<8||newPassword.length>128)throw new BadRequestException('Mật khẩu mới phải có từ 8 đến 128 ký tự, không chỉ gồm khoảng trắng.');
    if(newPassword===currentPassword)throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại.');
    const result=await this.db.query<Account>(`SELECT t.MaTaiKhoan,t.MaNguoi,t.MatKhauBam,t.PhienBanMatKhau
      FROM he_thong.TaiKhoanDangNhap t LEFT JOIN nhan_su.CanBo c ON c.MaNguoi=t.MaNguoi
      WHERE t.MaNguoi=@Nguoi AND t.DangHoatDong=1 AND t.DaXoa=0 AND (t.VaiTro IN('USER','THI_SINH') OR c.DangHoatDong=1)`,{Nguoi:subject});
    const account=result.recordset[0];
    if(!account)throw new ForbiddenException('Tài khoản này không hỗ trợ đổi mật khẩu cục bộ.');
    if(!await verifyPassword(currentPassword,account.MatKhauBam))throw new BadRequestException('Mật khẩu hiện tại không đúng.');
    const hash=await hashPassword(newPassword);
    const saved=await this.db.query<{DaLuu:number}>(`SET XACT_ABORT ON;
      BEGIN TRY BEGIN TRANSACTION;
      UPDATE he_thong.TaiKhoanDangNhap SET MatKhauBam=@BamMoi,PhienBanMatKhau=PhienBanMatKhau+1,NgayDoiMatKhau=SYSUTCDATETIME()
      WHERE MaTaiKhoan=@TaiKhoan AND PhienBanMatKhau=@PhienBanCu AND MatKhauBam=@BamCu AND DangHoatDong=1 AND DaXoa=0;
      IF @@ROWCOUNT<>1 BEGIN ROLLBACK; SELECT 0 AS DaLuu; RETURN; END;
      INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien)
      VALUES ('HE_THONG','TaiKhoanDangNhap',@TaiKhoan,'DOI_MAT_KHAU',@Nguoi);
      COMMIT; SELECT 1 AS DaLuu;
      END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{BamMoi:hash,TaiKhoan:account.MaTaiKhoan,PhienBanCu:account.PhienBanMatKhau,BamCu:account.MatKhauBam,Nguoi:account.MaNguoi});
    if(!saved.recordset[0]?.DaLuu)throw new ConflictException('Mật khẩu vừa thay đổi ở phiên khác. Hãy đăng nhập lại.');
  }
}
