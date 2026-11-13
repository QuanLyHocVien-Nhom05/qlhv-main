import { Injectable,ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

@Injectable()
export class RecoveryMailer {
 constructor(private readonly config:ConfigService){}
 private settings(){
  const host=this.config.get<string>('SMTP_HOST')?.trim(),user=this.config.get<string>('SMTP_USER')?.trim(),pass=this.config.get<string>('SMTP_PASSWORD'),from=this.config.get<string>('MAIL_FROM')?.trim();
  const port=Number(this.config.get<string>('SMTP_PORT')||'465');
  let origin:URL;try{origin=new URL(this.config.get<string>('PASSWORD_RESET_ORIGIN')||'');}catch{throw new ServiceUnavailableException('Chưa cấu hình dịch vụ gửi email. Vui lòng liên hệ quản trị viên.');}
  const local=['localhost','127.0.0.1','[::1]'].includes(origin.hostname);
  if(!host||!user||!pass||!from||/[\r\n]/.test(from)||!Number.isInteger(port)||port<1||port>65535||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/'||!(origin.protocol==='https:'||(local&&origin.protocol==='http:')))
   throw new ServiceUnavailableException('Chưa cấu hình dịch vụ gửi email. Vui lòng liên hệ quản trị viên.');
  return {host,port,user,pass,from,origin:origin.origin};
 }
 ensureConfigured(){this.settings();}
 private transport(){
  const settings=this.settings();
  const transporter=createTransport({host:settings.host,port:settings.port,secure:settings.port===465,requireTLS:settings.port!==465,auth:{user:settings.user,pass:settings.pass},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,logger:false,debug:false,tls:{minVersion:'TLSv1.2'}});
  return {settings,transporter};
 }
 async verify(){const {transporter}=this.transport();try{await transporter.verify();}finally{transporter.close();}}
 async sendNotification(to:string,subject:string,text:string){const {settings,transporter}=this.transport();try{const result=await transporter.sendMail({from:settings.from,to,subject,text,disableFileAccess:true,disableUrlAccess:true});if(!result.accepted?.length)throw new Error('Message not accepted');}finally{transporter.close();}}
 async send(to:string,token:string){
  const {settings,transporter}=this.transport();
  const link=`${settings.origin}/dat-lai-mat-khau#ma=${token}`;
  try{
   const result=await transporter.sendMail({from:settings.from,to,subject:'Đặt lại mật khẩu — Quản lý chương trình đào tạo',text:`Bạn vừa yêu cầu đặt lại mật khẩu.\n\nMở liên kết sau để tạo mật khẩu mới:\n${link}\n\nLiên kết có hiệu lực 15 phút và chỉ dùng một lần. Nếu bạn không gửi yêu cầu này, hãy bỏ qua email; mật khẩu hiện tại vẫn được giữ nguyên.`,disableFileAccess:true,disableUrlAccess:true});
   if(!result.accepted?.length)throw new Error('Message not accepted');
  }finally{transporter.close();}
 }
}
