import {Global,Injectable,Module,ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {createCipheriv,createDecipheriv,createHmac,randomBytes} from 'node:crypto';
@Injectable()
export class DataProtection{
 constructor(private readonly config:ConfigService){}
 private key(){const value=this.config.get<string>('DATA_ENCRYPTION_KEY')??'';if(!/^[a-f0-9]{64}$/i.test(value))throw new ServiceUnavailableException('Chưa cấu hình khóa bảo vệ dữ liệu tuyển sinh.');return Buffer.from(value,'hex');}
 seal(data:Buffer|string,context:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key(),iv);cipher.setAAD(Buffer.from(context));const encrypted=Buffer.concat([cipher.update(data),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]);}
 open(data:Buffer,context:string){if(data.length<28)throw new Error('Invalid protected data');const decipher=createDecipheriv('aes-256-gcm',this.key(),data.subarray(0,12));decipher.setAAD(Buffer.from(context));decipher.setAuthTag(data.subarray(12,28));return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]);}
 encode(value:unknown,context:string){return this.seal(JSON.stringify(value),context).toString('base64');}
 decode<T=Record<string,unknown>>(value:string,context:string):T{return JSON.parse(this.open(Buffer.from(value,'base64'),context).toString('utf8'));}
 identity(value:string){return createHmac('sha256',this.key()).update('admission-identity\0'+value.trim().toUpperCase()).digest('hex');}
}
@Global() @Module({providers:[DataProtection],exports:[DataProtection]})
export class DataProtectionModule{}
