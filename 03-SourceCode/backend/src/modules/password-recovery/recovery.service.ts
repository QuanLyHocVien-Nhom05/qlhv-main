import { Inject,Injectable,BadRequestException } from '@nestjs/common';
export interface RecoveryRepository{
 request(username:string,email:string):Promise<{message:string}>;list():Promise<unknown[]>;
 issue(id:number,revision:string,username:string,note:string,actor:string):Promise<{token:string;expiresAt:unknown}>;
 reject(id:number,revision:string,note:string,actor:string):Promise<{message:string}>;
 reset(token:string,password:string,confirmation:string):Promise<{message:string}>;
}
export const RECOVERY_REPOSITORY=Symbol('RECOVERY_REPOSITORY');
@Injectable()
export class RecoveryService{
 constructor(@Inject(RECOVERY_REPOSITORY) private readonly repository:RecoveryRepository){}
 private id(id:number){if(!Number.isSafeInteger(id)||id<1||id>999999999999)throw new BadRequestException('Mã yêu cầu không hợp lệ.');}
 request(username:string,email:string){return this.repository.request(username.trim().toLowerCase(),email.trim().toLowerCase());}
 list(){return this.repository.list();}
 issue(id:number,revision:string,username:string,note:string,actor:string){this.id(id);return this.repository.issue(id,revision,username.trim(),note.trim(),actor);}
 reject(id:number,revision:string,note:string,actor:string){this.id(id);return this.repository.reject(id,revision,note.trim(),actor);}
 reset(token:string,password:string,confirmation:string){if(password!==confirmation)throw new BadRequestException('Xác nhận mật khẩu không khớp.');if(password.trim().length<8||password.length>128)throw new BadRequestException('Mật khẩu cần 8–128 ký tự, không chỉ gồm khoảng trắng.');return this.repository.reset(token,password,confirmation);}
}
