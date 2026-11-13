import {Body,Controller,Get,HttpException,Param,ParseIntPipe,Post,Put,Query,Req,Res,UploadedFile,UseGuards,UseInterceptors,ForbiddenException,BadRequestException} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {IsBoolean,IsEmail,IsIn,IsInt,IsObject,IsOptional,IsString,Matches,Max,MaxLength,Min,MinLength,Equals} from 'class-validator';
import {Transform,Type} from 'class-transformer';
import type {Request,Response} from 'express';
import readXlsxFile from 'read-excel-file/node';
import {AccessGuard,Roles,ActorRequest} from '../../../shared/security/access.guard';
import {PageDto} from '../../management/presentation/management.controller';
import {AdmissionsService,AdmissionActor} from '../application/admissions.service';
import {AdmissionFiles} from '../infrastructure/admission-files.service';
import {PaymentGateway} from '../infrastructure/payment.gateway';
import {ExamService} from '../application/exam.service';
import {AdmissionDocuments} from '../infrastructure/admission-documents.service';
import {AdmissionJobs} from '../infrastructure/admission-jobs.service';
import {ExternalAdapters} from '../infrastructure/external.adapters';
const actor=(req:ActorRequest):AdmissionActor=>({...req.actor,ip:req.ip});
class RegisterDto{
 @Transform(({value})=>typeof value==='string'?value.trim():value) @IsString() @MinLength(2) @MaxLength(150) HoTen!:string;
 @Transform(({value})=>typeof value==='string'?value.trim().toLowerCase():value) @IsEmail() @MaxLength(254) Email!:string;
 @Matches(/^[A-Za-z0-9]{6,20}$/) SoGiayTo!:string;
 @IsString() @MinLength(8) @MaxLength(128) MatKhau!:string;
 @IsString() @MinLength(8) @MaxLength(128) XacNhanMatKhau!:string;
 @Equals(true) DongY!:boolean;
}
class DraftDto{@IsInt() @Min(1) MaChiTieu!:number;@IsObject() profile!:Record<string,unknown>;@IsOptional() @Matches(/^0x[0-9a-fA-F]{16}$/) Version?:string;}
class VersionDto{@Matches(/^0x[0-9a-fA-F]{16}$/) Version!:string;}
class AttachDto{@IsInt() @Min(1) MaTaiLieu!:number;}
class PayDto{@IsIn(['XET_TUYEN','NHAP_HOC']) LoaiPhi!:string;@IsOptional() @IsIn(['VNPAY','MOMO','NGAN_HANG']) Kenh?:string;}
class ReasonDto{@IsString() @MinLength(5) @MaxLength(2000) LyDo!:string;}
class ReviewDto extends ReasonDto{@Matches(/^0x[0-9a-fA-F]{16}$/) Version!:string;@IsIn(['CAN_BO_SUNG','DU_DIEU_KIEN','TU_CHOI']) KetQua!:string;@IsOptional() @Matches(/^[A-Z0-9_]{1,40}$/) MaLyDo?:string;@IsOptional() @IsString() @MaxLength(40) HanBoSung?:string;}
class ScoreDto{@IsString() @MinLength(1) @MaxLength(60) MaPhach!:string;@IsObject() scores!:Record<string,unknown>;}
class ResolveDto extends ReasonDto{@IsObject() scores!:Record<string,unknown>;}
class ApproveDto{@IsInt() @Min(1) @Max(3) CapDuyet!:number;@IsString() @MinLength(5) @MaxLength(1000) GhiChu!:string;}
class AllocateDto{@IsOptional() @IsInt() @Min(1) MaChiTieu?:number;}
class EnrollDto{@IsOptional() @IsInt() @Min(1) MaPhienBan?:number;@IsOptional() @IsInt() @Min(1) MaLopQuanLy?:number;}
class VerifyDocDto{@IsBoolean() DaDoiChieu!:boolean;}
class AttendanceDto{@IsBoolean() CoMat!:boolean;}
class ExportDto{@IsIn(['applications','accepted','revenue']) kind='applications';@IsIn(['xlsx','pdf','docx']) format='xlsx';@IsOptional() @Type(()=>Number) @IsInt() @Min(1) dot?:number;@IsOptional() @Type(()=>Number) @IsInt() @Min(1) template?:number;}
@Controller()
export class AdmissionsPublicController{
 private attempts=new Map<string,{count:number;until:number}>();
 constructor(private readonly service:AdmissionsService,private readonly payment:PaymentGateway,private readonly docs:AdmissionDocuments){}
 @Post('auth/register') register(@Body() body:RegisterDto,@Req() req:Request){const now=Date.now();for(const [k,v]of this.attempts)if(v.until<now)this.attempts.delete(k);const key=req.ip??'',r=this.attempts.get(key)??{count:0,until:now+900000};if(r.count>=5)throw new HttpException('Thử lại đăng ký sau 15 phút.',429);r.count++;this.attempts.set(key,r);return this.service.register(body);}
 @Get('public/admission-options') options(){return this.service.options();}
 @Get('public/admission-letter/verify') verify(@Query('token') token:string){return this.docs.verify(token??'');}
 @Post('integrations/momo/ipn') async momoIpn(@Body() body:Record<string,unknown>,@Res() res:Response){await this.payment.momoCallback(body);res.status(204).send();}
 @Get('integrations/vnpay/ipn') ipn(@Query() query:Record<string,unknown>){return this.payment.callback(query);}
}
@Controller('my/admissions') @UseGuards(AccessGuard) @Roles('APPLICANT','STUDENT')
export class AdmissionsOwnerController{
 constructor(private readonly service:AdmissionsService,private readonly files:AdmissionFiles,private readonly pay:PaymentGateway,private readonly docs:AdmissionDocuments){}
 @Get('options') options(){return this.service.options();}
 @Get() list(@Req() req:ActorRequest,@Query() q:PageDto){return this.service.list(actor(req),q.search,q.page,q.status);}
 @Get(':id') get(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.get(id,actor(req));}
 @Post() draft(@Body() body:DraftDto,@Req() req:ActorRequest){return this.service.draft(actor(req),body.MaChiTieu,body.profile);}
 @Put(':id') edit(@Param('id',ParseIntPipe) id:number,@Body() body:DraftDto,@Req() req:ActorRequest){return this.service.draft(actor(req),body.MaChiTieu,body.profile,id,body.Version);}
 @Post('files') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:10*1024*1024,files:1}})) upload(@UploadedFile() file:{buffer:Buffer;originalname:string},@Body('LoaiTaiLieu') type:string,@Req() req:ActorRequest){return this.files.upload(file,type,actor(req));}
 @Post(':id/documents') attach(@Param('id',ParseIntPipe) id:number,@Body() body:AttachDto,@Req() req:ActorRequest){return this.service.attach(id,body.MaTaiLieu,actor(req));}
 @Post(':id/submit') submit(@Param('id',ParseIntPipe) id:number,@Body() body:VersionDto,@Req() req:ActorRequest){return this.service.submit(id,body.Version,actor(req));}
 @Post(':id/pay') payFee(@Param('id',ParseIntPipe) id:number,@Body() body:PayDto,@Req() req:ActorRequest){return this.pay.initiate(id,body.LoaiPhi,actor(req),body.Kenh);}
 @Post(':id/appeal') appeal(@Param('id',ParseIntPipe) id:number,@Body() body:ReasonDto,@Req() req:ActorRequest){return this.service.appeal(id,body.LyDo,actor(req));}
 @Post(':id/confirm-enrollment') confirm(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.confirm(id,actor(req));}
 @Get(':id/letter/:kind') async letter(@Param('id',ParseIntPipe) id:number,@Param('kind') kind:string,@Req() req:ActorRequest,@Res() res:Response){const file=await this.docs.letter(id,kind,actor(req));res.setHeader('Cache-Control','no-store');res.type('application/pdf').attachment('giay-bao-'+id+'.pdf').send(file);}
}
@Controller('admissions/files') @UseGuards(AccessGuard) @Roles('APPLICANT','STUDENT','ACADEMIC_ADMIN','OFFICER','LEADER')
export class AdmissionFileController{
 constructor(private readonly files:AdmissionFiles){}
 @Get(':id') async download(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest,@Res() res:Response){const file=await this.files.content(id,actor(req));res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.type(file.LoaiNoiDung).attachment(file.TenTep).send(file.buffer);}
}
@Controller('admin/admissions') @UseGuards(AccessGuard) @Roles('ACADEMIC_ADMIN','OFFICER','LEADER','LECTURER')
export class AdmissionsAdminController{
 constructor(private readonly service:AdmissionsService,private readonly exams:ExamService,private readonly docs:AdmissionDocuments,private readonly jobs:AdmissionJobs,private readonly integrations:ExternalAdapters){}
 @Get('review-reasons') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') reviewReasons(){return this.service.reviewReasons();}
 @Get('batches/:id/selection') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') selection(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.selection(id,actor(req));}
 @Get('integrations') integrationsStatus(){return this.integrations.status();}
 @Get('exams') myExams(@Req() req:ActorRequest){return this.exams.mine(actor(req));}
 @Get('applications') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') list(@Req() req:ActorRequest,@Query() q:PageDto){return this.service.list(actor(req),q.search,q.page,q.status);}
 @Get('applications/:id') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') get(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.get(id,actor(req));}
 @Post('applications/:id/review') @Roles('ACADEMIC_ADMIN','OFFICER') review(@Param('id',ParseIntPipe) id:number,@Body() body:ReviewDto,@Req() req:ActorRequest){return this.service.review(id,body,actor(req));}
 @Post('documents/:id/verify') @Roles('ACADEMIC_ADMIN','OFFICER') verify(@Param('id',ParseIntPipe) id:number,@Body() body:VerifyDocDto,@Req() req:ActorRequest){return this.service.verifyDocument(id,actor(req),body.DaDoiChieu);}
 @Post('applications/:id/screen') @Roles('ACADEMIC_ADMIN','OFFICER') async screen(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){await this.service.get(id,actor(req));return this.service.preScreen(id);}
 @Get('exams/:id/roster') roster(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.exams.roster(id,actor(req));}
 @Get('exams/:id/blind') blind(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.exams.roster(id,actor(req),true);}
 @Post('exams/:id/allocate') @Roles('ACADEMIC_ADMIN','OFFICER') allocate(@Param('id',ParseIntPipe) id:number,@Body() body:AllocateDto,@Req() req:ActorRequest){return this.exams.allocate(id,body.MaChiTieu??null,actor(req));}
 @Post('exams/:id/publish') @Roles('ACADEMIC_ADMIN','OFFICER') publish(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.exams.publish(id,actor(req));}
 @Post('exams/:id/attendance/:assignment') attend(@Param('id',ParseIntPipe) id:number,@Param('assignment',ParseIntPipe) assignment:number,@Body() body:AttendanceDto,@Req() req:ActorRequest){return this.exams.attend(id,assignment,body.CoMat,actor(req));}
 @Post('scores') @Roles('ACADEMIC_ADMIN','LECTURER') score(@Body() body:ScoreDto,@Req() req:ActorRequest){return this.service.score(body.MaPhach,body.scores,actor(req));}
 @Post('scores/import') @Roles('ACADEMIC_ADMIN','LECTURER') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:2*1024*1024,files:1}}))
 async scoreImport(@UploadedFile() file:{buffer:Buffer}|undefined,@Req() req:ActorRequest){if(!file)throw new BadRequestException('Chọn tệp Excel.');const sheets=await readXlsxFile(file.buffer);const rows=sheets[0]?.data??[];const header=rows[0]?.map(String).join(',');const paper=header==='MaPhach,Diem,UuTien';if(rows.length<2||rows.length>101||!paper&&header!=='MaPhach,CoSo,ChuyenNganh,NgoaiNgu,UuTien')throw new BadRequestException('Dùng MaPhach,CoSo,ChuyenNganh,NgoaiNgu,UuTien hoặc MaPhach,Diem,UuTien; tối đa 100 dòng.');
  // Each row is explicitly reported; committed rows are never hidden by a later failure.
  const results=[];for(let i=1;i<rows.length;i++){try{await this.service.score(String(rows[i][0]),paper?{Diem:rows[i][1],UuTien:rows[i][2]??0}:{CoSo:rows[i][1],ChuyenNganh:rows[i][2],NgoaiNgu:rows[i][3],UuTien:rows[i][4]},actor(req));results.push({line:i+1,ok:true});}catch(e){results.push({line:i+1,ok:false,error:e instanceof Error?e.message:'Không nhập được dòng'});}}return {results};}
 @Post('applications/:id/resolve-appeal') @Roles('ACADEMIC_ADMIN','LEADER') resolve(@Param('id',ParseIntPipe) id:number,@Body() body:ResolveDto,@Req() req:ActorRequest){return this.service.resolveAppeal(id,body.scores,body.LyDo,actor(req));}
 @Post('batches/:id/rank') @Roles('ACADEMIC_ADMIN','OFFICER') rank(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.rank(id,actor(req));}
 @Post('batches/:id/approve') @Roles('ACADEMIC_ADMIN','LEADER') approve(@Param('id',ParseIntPipe) id:number,@Body() body:ApproveDto,@Req() req:ActorRequest){return this.service.approve(id,body.CapDuyet,body.GhiChu,actor(req));}
 @Post('applications/:id/enroll') @Roles('ACADEMIC_ADMIN','OFFICER') enroll(@Param('id',ParseIntPipe) id:number,@Body() body:EnrollDto,@Req() req:ActorRequest){return this.service.enroll(id,body.MaPhienBan,body.MaLopQuanLy??null,actor(req));}
 @Get('reports') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') async report(@Query() q:ExportDto,@Req() req:ActorRequest,@Res() res:Response){const file=await this.docs.report(q.kind,q.format,actor(req),q.dot,q.template);res.setHeader('Cache-Control','no-store');res.attachment('tuyen-sinh-'+q.kind+'.'+q.format).send(file);}
 @Post('jobs/run') @Roles('ACADEMIC_ADMIN') async runJobs(){await this.jobs.tick();return {ok:true};}
 @Post('transfers/:id/sync') @Roles('ACADEMIC_ADMIN') sync(@Param('id',ParseIntPipe) id:number){return this.jobs.transfer(id);}
}
