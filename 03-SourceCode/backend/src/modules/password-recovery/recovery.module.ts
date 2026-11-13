import { Body,Controller,Get,Module,Param,ParseIntPipe,Post,Req,Res,UseGuards,HttpException,HttpStatus } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IsEmail,IsString,Matches,MaxLength,MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import type { Request,Response } from 'express';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { AccessGuard,Roles,type ActorRequest } from '../../shared/security/access.guard';
import { RecoveryService,RECOVERY_REPOSITORY } from './recovery.service';
import { SqlRecoveryRepository } from './infrastructure/sql-recovery.repository';
import { EmailRecoveryService,EMAIL_RECOVERY_REPOSITORY,EMAIL_RECOVERY_MAILER } from './email-recovery.service';
import { RecoveryMailer } from './infrastructure/recovery-mailer';
class RequestDto{@IsString() @MinLength(1) @MaxLength(100) username!:string;@IsEmail() @MaxLength(254) email!:string;}
class ResetDto{@Matches(/^[A-Za-z0-9_-]{43}$/) token!:string;@IsString() @MinLength(8) @MaxLength(128) newPassword!:string;@IsString() @MinLength(8) @MaxLength(128) confirmPassword!:string;}
class ReviewDto{@Matches(/^0x[0-9a-fA-F]{16}$/) Revision!:string;@Transform(({value})=>typeof value==='string'?value.trim():value) @IsString() @MinLength(10) @MaxLength(500) note!:string;}
class IssueDto extends ReviewDto{@IsString() @MinLength(1) @MaxLength(100) username!:string;}
@ApiTags('password-recovery') @Controller('auth/password-recovery')
class RecoveryController{
 private attempts=new Map<string,{count:number;until:number}>();
 constructor(private readonly service:RecoveryService,private readonly emailService:EmailRecoveryService){}
 private limit(req:Request,kind:string,max:number){const now=Date.now();for(const [key,value]of this.attempts)if(value.until<=now)this.attempts.delete(key);const key=kind+':'+req.ip,record=this.attempts.get(key)??{count:0,until:now+15*60000};if(record.count>=max)throw new HttpException('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',HttpStatus.TOO_MANY_REQUESTS);record.count++;this.attempts.set(key,record);}
 @Post('request') request(@Body() body:RequestDto,@Req() req:Request){this.limit(req,'request',5);return this.service.request(body.username,body.email);}
 @Post('email') email(@Body() body:RequestDto,@Req() req:Request){this.limit(req,'email',5);return this.emailService.request(body.username,body.email);}
 @Post('reset') reset(@Body() body:ResetDto,@Req() req:Request){this.limit(req,'reset',10);return this.service.reset(body.token,body.newPassword,body.confirmPassword);}
}
@ApiTags('password-recovery') @ApiBearerAuth() @Controller('password-recovery/admin/requests') @UseGuards(AccessGuard) @Roles('ACADEMIC_ADMIN')
class RecoveryAdminController{
 constructor(private readonly service:RecoveryService){}
 @Get() list(){return this.service.list();}
 @Post(':id/issue') async issue(@Param('id',ParseIntPipe) id:number,@Body() body:IssueDto,@Req() req:ActorRequest,@Res({passthrough:true}) response:Response){response.setHeader('Cache-Control','no-store');return this.service.issue(id,body.Revision,body.username,body.note,req.actor.sub);}
 @Post(':id/reject') reject(@Param('id',ParseIntPipe) id:number,@Body() body:ReviewDto,@Req() req:ActorRequest){return this.service.reject(id,body.Revision,body.note,req.actor.sub);}
}
@Module({imports:[JwtModule.register({})],controllers:[RecoveryController,RecoveryAdminController],providers:[AccessGuard,RecoveryService,EmailRecoveryService,SqlRecoveryRepository,RecoveryMailer,{provide:RECOVERY_REPOSITORY,useExisting:SqlRecoveryRepository},{provide:EMAIL_RECOVERY_REPOSITORY,useExisting:SqlRecoveryRepository},{provide:EMAIL_RECOVERY_MAILER,useExisting:RecoveryMailer}]})
export class RecoveryModule{}
