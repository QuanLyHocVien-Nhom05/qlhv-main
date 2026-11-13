import { Inject,Injectable,Logger } from '@nestjs/common';
import { randomBytes,createHash } from 'node:crypto';
export interface EmailRecoveryRepository {
 reserveEmail(username:string,email:string,digest:string):Promise<{id:number;email:string}|null>;
 cancelEmail(id:number,digest:string):Promise<void>;
}
export interface EmailRecoveryMailer {ensureConfigured():void;send(email:string,token:string):Promise<void>;}
export const EMAIL_RECOVERY_REPOSITORY=Symbol('EMAIL_RECOVERY_REPOSITORY');
export const EMAIL_RECOVERY_MAILER=Symbol('EMAIL_RECOVERY_MAILER');
@Injectable()
export class EmailRecoveryService {
 private readonly logger=new Logger(EmailRecoveryService.name);
 constructor(@Inject(EMAIL_RECOVERY_REPOSITORY) private readonly repository:EmailRecoveryRepository,@Inject(EMAIL_RECOVERY_MAILER) private readonly mailer:EmailRecoveryMailer){}
 async request(username:string,email:string){
  // The configuration check happens before account lookup for every caller.
  this.mailer.ensureConfigured();
  const token=randomBytes(32).toString('base64url'),digest=createHash('sha256').update(token).digest('hex');
  const reserved=await this.repository.reserveEmail(username.trim().toLowerCase(),email.trim().toLowerCase(),digest);
  if(reserved){try{await this.mailer.send(reserved.email,token);}catch{
   // Never log SMTP errors, recipients, passwords, or recovery links.
   try{await this.repository.cancelEmail(reserved.id,digest);}catch{this.logger.error('Không thể thu hồi mã sau lỗi gửi thư.');}
   this.logger.error('Gửi email khôi phục thất bại. Kiểm tra kết nối và cấu hình SMTP trên máy chủ.');
  }}
  return {message:'Nếu tên đăng nhập và email khớp với tài khoản người dùng đang hoạt động, liên kết đặt lại mật khẩu sẽ được gửi đến email đã đăng ký. Vui lòng kiểm tra cả thư mục thư rác; có thể yêu cầu gửi lại sau 60 giây.'};
 }
}
