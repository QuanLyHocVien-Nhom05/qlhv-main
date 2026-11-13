import { Injectable,BadRequestException } from '@nestjs/common';
import { randomBytes,createHash } from 'node:crypto';
import { SqlServerService } from '../../../shared/infrastructure/sql-server.service';
import { hashPassword } from '../../auth/password';
export const recoveryHash=(token:string)=>createHash('sha256').update(token).digest('hex');
@Injectable()
export class SqlRecoveryRepository{
 constructor(private readonly db:SqlServerService){}
 async reserveEmail(username:string,email:string,digest:string){
  const result=await this.db.query<{MaYeuCau:number;ThuDienTu:string}>(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;
   DECLARE @TaiKhoan bigint,@Version int,@Email nvarchar(254),@Id bigint,@Nguoi bigint;
   SELECT @TaiKhoan=t.MaTaiKhoan,@Nguoi=t.MaNguoi,@Version=t.PhienBanMatKhau,@Email=n.ThuDienTu FROM he_thong.TaiKhoanDangNhap t WITH(UPDLOCK,HOLDLOCK) JOIN danh_muc.Nguoi n WITH(HOLDLOCK) ON n.MaNguoi=t.MaNguoi
   WHERE t.TenDangNhap=@Ten AND n.ThuDienTu=@EmailNhap AND t.VaiTro IN('USER','THI_SINH') AND t.DangHoatDong=1 AND t.DaXoa=0;
   IF @TaiKhoan IS NOT NULL AND NOT EXISTS(SELECT 1 FROM he_thong.YeuCauKhoiPhucMatKhau WHERE MaTaiKhoan=@TaiKhoan AND KenhKhoiPhuc='EMAIL' AND NgayYeuCau>DATEADD(second,-60,SYSUTCDATETIME())) BEGIN
    UPDATE he_thong.YeuCauKhoiPhucMatKhau SET HieuLuc=0 WHERE MaTaiKhoan=@TaiKhoan AND HieuLuc=1;
    INSERT he_thong.YeuCauKhoiPhucMatKhau(MaTaiKhoan,TrangThai,MaBamMaKhoiPhuc,HanSuDung,PhienBanMatKhau,KenhKhoiPhuc)
    VALUES(@TaiKhoan,'DA_CAP_MA',@Bam,DATEADD(minute,15,SYSUTCDATETIME()),@Version,'EMAIL');
    SET @Id=CONVERT(bigint,SCOPE_IDENTITY());
    INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet) VALUES('HE_THONG','YeuCauKhoiPhucMatKhau',@Id,'YEU_CAU_EMAIL_KHOI_PHUC',@Nguoi,N'{"Kenh":"EMAIL","DaXacMinhDanhTinh":false}');
   END;
   COMMIT;SELECT @Id AS MaYeuCau,@Email AS ThuDienTu WHERE @Id IS NOT NULL;
   END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Ten:username,EmailNhap:email,Bam:digest});
  return result.recordset[0]?{id:result.recordset[0].MaYeuCau,email:result.recordset[0].ThuDienTu}:null;
 }
 async cancelEmail(id:number,digest:string){await this.db.query(`UPDATE he_thong.YeuCauKhoiPhucMatKhau SET HieuLuc=0 WHERE MaYeuCau=@Id AND MaBamMaKhoiPhuc=@Bam AND KenhKhoiPhuc='EMAIL' AND HieuLuc=1`,{Id:id,Bam:digest});}
 async request(username:string,email:string){await this.db.query(`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
 DECLARE @TaiKhoan bigint; SELECT @TaiKhoan=t.MaTaiKhoan FROM he_thong.TaiKhoanDangNhap t WITH(UPDLOCK,HOLDLOCK) JOIN danh_muc.Nguoi n ON n.MaNguoi=t.MaNguoi WHERE t.TenDangNhap=@Ten AND n.ThuDienTu=@Email AND t.VaiTro IN('USER','THI_SINH') AND t.DangHoatDong=1 AND t.DaXoa=0;
 IF @TaiKhoan IS NOT NULL BEGIN
 UPDATE he_thong.YeuCauKhoiPhucMatKhau SET HieuLuc=0 WHERE MaTaiKhoan=@TaiKhoan AND HieuLuc=1 AND TrangThai='DA_CAP_MA' AND HanSuDung<=SYSUTCDATETIME();
 IF NOT EXISTS(SELECT 1 FROM he_thong.YeuCauKhoiPhucMatKhau WHERE MaTaiKhoan=@TaiKhoan AND HieuLuc=1) INSERT he_thong.YeuCauKhoiPhucMatKhau(MaTaiKhoan) VALUES(@TaiKhoan);
 END; COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{Ten:username.trim().toLowerCase(),Email:email.trim().toLowerCase()});return {message:'Nếu thông tin khớp với tài khoản người dùng đang hoạt động, yêu cầu đã được ghi nhận để quản trị viên xác minh. Liên hệ đơn vị phụ trách để nhận mã qua kênh đã xác minh.'};}
 async list(){return(await this.db.query(`SELECT TOP(100) y.MaYeuCau,t.TenDangNhap,n.HoTen,n.ThuDienTu,y.NgayYeuCau,CASE WHEN y.TrangThai='DA_CAP_MA' AND y.HanSuDung<=SYSUTCDATETIME() THEN 'HET_HAN' ELSE y.TrangThai END AS TrangThai,y.HieuLuc,y.HanSuDung,y.GhiChuXacMinh,t.DangHoatDong,t.DaXoa,t.VaiTro,CONVERT(nvarchar(18),CONVERT(varbinary(8),y.PhienBanDuLieu),1) AS Revision FROM he_thong.YeuCauKhoiPhucMatKhau y JOIN he_thong.TaiKhoanDangNhap t ON t.MaTaiKhoan=y.MaTaiKhoan JOIN danh_muc.Nguoi n ON n.MaNguoi=t.MaNguoi ORDER BY y.MaYeuCau DESC`)).recordset;}
 async issue(id:number,revision:string,username:string,note:string,actor:string){await this.db.resolveStaff(actor);const token=randomBytes(32).toString('base64url'),digest=recoveryHash(token);const result=await this.db.query(`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
 DECLARE @TaiKhoan bigint,@Version int; SELECT @TaiKhoan=MaTaiKhoan FROM he_thong.YeuCauKhoiPhucMatKhau WHERE MaYeuCau=@Id;
 SELECT @Version=PhienBanMatKhau FROM he_thong.TaiKhoanDangNhap WITH(UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@TaiKhoan AND TenDangNhap=@Ten AND VaiTro IN('USER','THI_SINH') AND DangHoatDong=1 AND DaXoa=0 AND MaNguoi<>@Nguoi;
 IF @Version IS NULL THROW 51091,N'Tài khoản không còn phù hợp hoặc tên xác nhận không đúng.',1;
 UPDATE he_thong.YeuCauKhoiPhucMatKhau SET TrangThai='DA_CAP_MA',MaBamMaKhoiPhuc=@Bam,HanSuDung=DATEADD(minute,15,SYSUTCDATETIME()),PhienBanMatKhau=@Version,MaNguoiXacMinh=@Nguoi,NgayXacMinh=SYSUTCDATETIME(),GhiChuXacMinh=@GhiChu
 WHERE MaYeuCau=@Id AND HieuLuc=1 AND TrangThai IN('CHO_XAC_MINH','DA_CAP_MA') AND PhienBanDuLieu=TRY_CONVERT(binary(8),@Revision,1);
 IF @@ROWCOUNT<>1 THROW 51091,N'Yêu cầu đã thay đổi hoặc đã kết thúc.',1;
 INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien) VALUES('HE_THONG','YeuCauKhoiPhucMatKhau',@Id,'CAP_MA_KHOI_PHUC',@Nguoi);
 SELECT HanSuDung FROM he_thong.YeuCauKhoiPhucMatKhau WHERE MaYeuCau=@Id;
 COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{Id:id,Revision:revision,Ten:username.trim(),GhiChu:note.trim(),Nguoi:actor,Bam:digest});return {token,expiresAt:result.recordset[0].HanSuDung};}
 async reject(id:number,revision:string,note:string,actor:string){await this.db.resolveStaff(actor);await this.db.query(`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
 DECLARE @TaiKhoan bigint; SELECT @TaiKhoan=MaTaiKhoan FROM he_thong.YeuCauKhoiPhucMatKhau WHERE MaYeuCau=@Id;
 SELECT MaTaiKhoan FROM he_thong.TaiKhoanDangNhap WITH(UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@TaiKhoan;
 UPDATE he_thong.YeuCauKhoiPhucMatKhau SET TrangThai='TU_CHOI',HieuLuc=0,GhiChuXacMinh=@GhiChu,MaNguoiXacMinh=@Nguoi,NgayXacMinh=SYSUTCDATETIME() WHERE MaYeuCau=@Id AND HieuLuc=1 AND PhienBanDuLieu=TRY_CONVERT(binary(8),@Revision,1);
 IF @@ROWCOUNT<>1 THROW 51091,N'Yêu cầu đã thay đổi hoặc kết thúc.',1;
 INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien) VALUES('HE_THONG','YeuCauKhoiPhucMatKhau',@Id,'TU_CHOI_KHOI_PHUC',@Nguoi);
 COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{Id:id,Revision:revision,GhiChu:note.trim(),Nguoi:actor});return {message:'Đã từ chối yêu cầu.'};}
 async reset(token:string,password:string,confirmation:string){if(password!==confirmation)throw new BadRequestException('Xác nhận mật khẩu không khớp.');if(password.trim().length<8)throw new BadRequestException('Mật khẩu cần ít nhất 8 ký tự, không chỉ gồm khoảng trắng.');const digest=recoveryHash(token);const hashed=await hashPassword(password);
 await this.db.query(`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
 DECLARE @TaiKhoan bigint,@Nguoi bigint,@Version int,@Id bigint; SELECT @TaiKhoan=MaTaiKhoan FROM he_thong.YeuCauKhoiPhucMatKhau WHERE MaBamMaKhoiPhuc=@Bam;
 SELECT @Nguoi=MaNguoi,@Version=PhienBanMatKhau FROM he_thong.TaiKhoanDangNhap WITH(UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@TaiKhoan AND VaiTro IN('USER','THI_SINH') AND DangHoatDong=1 AND DaXoa=0;
 SELECT @Id=MaYeuCau FROM he_thong.YeuCauKhoiPhucMatKhau WITH(UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@TaiKhoan AND MaBamMaKhoiPhuc=@Bam AND HieuLuc=1 AND TrangThai='DA_CAP_MA' AND HanSuDung>SYSUTCDATETIME() AND PhienBanMatKhau=@Version;
 IF @Id IS NULL OR @Nguoi IS NULL THROW 51200,N'Mã khôi phục không hợp lệ, đã hết hạn hoặc đã được sử dụng.',1;
 UPDATE he_thong.TaiKhoanDangNhap SET MatKhauBam=@MatKhau,PhienBanMatKhau=PhienBanMatKhau+1,NgayDoiMatKhau=SYSUTCDATETIME() WHERE MaTaiKhoan=@TaiKhoan;
 UPDATE he_thong.YeuCauKhoiPhucMatKhau SET TrangThai='DA_SU_DUNG',HieuLuc=0,NgaySuDung=SYSUTCDATETIME() WHERE MaYeuCau=@Id;
 INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien) VALUES('HE_THONG','TaiKhoanDangNhap',@TaiKhoan,'KHOI_PHUC_MAT_KHAU',@Nguoi);
 COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,{Bam:digest,MatKhau:hashed});return {message:'Đã đặt lại mật khẩu. Các phiên đăng nhập cũ đã bị thu hồi. Vui lòng đăng nhập lại.'};}
}
