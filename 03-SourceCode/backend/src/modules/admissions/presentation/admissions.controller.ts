import {ExamOrganization} from '../application/exam-organization.service';
import {Body,Controller,Get,HttpException,Param,ParseIntPipe,Post,Put,Query,Req,Res,UploadedFile,UseGuards,UseInterceptors,ForbiddenException,BadRequestException} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {IsBoolean,IsArray,ArrayMinSize,ArrayMaxSize,IsEmail,IsIn,IsInt,IsObject,IsOptional,IsString,Matches,Max,MaxLength,Min,MinLength,Equals} from 'class-validator';
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
class PayDto{@IsIn(['XET_TUYEN','NHAP_HOC']) LoaiPhi!:string;@IsOptional() @IsIn(['VNPAY','MOMO','NGAN_HANG','MO_PHONG']) Kenh?:string;}
class DemoPaymentDto{@IsIn(['THANH_CONG','THAT_BAI','HET_HAN']) KetQua!:'THANH_CONG'|'THAT_BAI'|'HET_HAN';}
class ReasonDto{@IsString() @MinLength(5) @MaxLength(2000) LyDo!:string;}
class ReviewDto extends ReasonDto{@Matches(/^0x[0-9a-fA-F]{16}$/) Version!:string;@IsIn(['CAN_BO_SUNG','DU_DIEU_KIEN','TU_CHOI']) KetQua!:string;@IsOptional() @Matches(/^[A-Z0-9_]{1,40}$/) MaLyDo?:string;@IsOptional() @IsString() @MaxLength(40) HanBoSung?:string;}
class ScoreDto{@IsString() @MinLength(1) @MaxLength(60) MaPhach!:string;@IsObject() scores!:Record<string,unknown>;}
class ResolveDto extends ReasonDto{@IsObject() scores!:Record<string,unknown>;}
class TieDecisionDto{@IsArray() @ArrayMinSize(2) @ArrayMaxSize(2000) @IsInt({each:true}) @Min(1,{each:true}) ThuTuHoSo!:number[];@IsString() @MinLength(5) @MaxLength(1000) LyDo!:string;}
class ApproveDto{@IsString() @MinLength(5) @MaxLength(1000) GhiChu!:string;}
class BatchAllocationDto{@IsBoolean() Preview!:boolean;}
class SbdSettingsDto{@IsString() @MaxLength(50) MauSoBaoDanh!:string;@IsInt() @Min(1) @Max(15) DoDaiSoBaoDanh!:number;@Matches(/^0x[0-9a-fA-F]{16}$/) Version!:string;}
class AllocateDto{@IsOptional() @IsInt() @Min(1) MaChiTieu?:number;}
class EnrollDto{@IsOptional() @IsInt() @Min(1) MaGVHD?:number;@IsOptional() @IsInt() @Min(1) MaPhienBan?:number;@IsOptional() @IsInt() @Min(1) MaLopQuanLy?:number;}
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
 @Get('payment-options') paymentOptions(){return this.pay.options();}
 @Get() list(@Req() req:ActorRequest,@Query() q:PageDto){return this.service.list(actor(req),q.search,q.page,q.status);}
 @Get(':id') get(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.get(id,actor(req));}
 @Get(':id/profile-form') async profileForm(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest,@Res() res:Response){const file=await this.docs.biography(id,actor(req));res.setHeader('Cache-Control','no-store');res.type('application/pdf').attachment('so-yeu-ly-lich-agu.pdf').send(file);}
 @Post() draft(@Body() body:DraftDto,@Req() req:ActorRequest){return this.service.draft(actor(req),body.MaChiTieu,body.profile);}
 @Put(':id') edit(@Param('id',ParseIntPipe) id:number,@Body() body:DraftDto,@Req() req:ActorRequest){return this.service.draft(actor(req),body.MaChiTieu,body.profile,id,body.Version);}
 @Post('files') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:10*1024*1024,files:1}})) upload(@UploadedFile() file:{buffer:Buffer;originalname:string},@Body('LoaiTaiLieu') type:string,@Req() req:ActorRequest){return this.files.upload(file,type,actor(req));}
 @Post(':id/documents') attach(@Param('id',ParseIntPipe) id:number,@Body() body:AttachDto,@Req() req:ActorRequest){return this.service.attach(id,body.MaTaiLieu,actor(req));}
 @Post(':id/submit') submit(@Param('id',ParseIntPipe) id:number,@Body() body:VersionDto,@Req() req:ActorRequest){return this.service.submit(id,body.Version,actor(req));}
 @Post(':id/pay') payFee(@Param('id',ParseIntPipe) id:number,@Body() body:PayDto,@Req() req:ActorRequest){return this.pay.initiate(id,body.LoaiPhi,actor(req),body.Kenh);}
 @Get(':id/demo-payments/:code') demoStatus(@Param('id',ParseIntPipe) id:number,@Param('code') code:string,@Req() req:ActorRequest){return this.pay.demoStatus(id,code,actor(req));}
 @Post(':id/demo-payments/:code/result') demoResult(@Param('id',ParseIntPipe) id:number,@Param('code') code:string,@Body() body:DemoPaymentDto,@Req() req:ActorRequest){return this.pay.demoResult(id,code,body.KetQua,actor(req));}
 @Get(':id/demo-payments/:code/receipt') async demoReceipt(@Param('id',ParseIntPipe) id:number,@Param('code') code:string,@Req() req:ActorRequest,@Res() res:Response){
  const payment=await this.pay.demoStatus(id,code,actor(req));if(payment.TrangThai!=='DA_TT')throw new BadRequestException('Chưa có biên lai mô phỏng thành công.');
  const file=await this.docs.pdf('BIÊN LAI MÔ PHỎNG - ĐỒ ÁN',[
   'KHÔNG CÓ GIÁ TRỊ THU TIỀN. Không có giao dịch ngân hàng thật.',
   'Mã biên lai: '+payment.MaBienLai,'Mã giao dịch: '+payment.MaGiaoDich,
   'Khoản phí: '+(payment.LoaiPhi==='XET_TUYEN'?'Lệ phí dự tuyển':'Phí nhập học'),
   'Số tiền mô phỏng: '+Number(payment.SoTien).toLocaleString('vi-VN')+' VND',
   'Không tính vào doanh thu thực tế của nhà trường.',
  ]);res.setHeader('Cache-Control','no-store');res.type('application/pdf').attachment('bien-lai-mo-phong.pdf').send(file);
 }
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
 constructor(private readonly service:AdmissionsService,private readonly exams:ExamService,private readonly docs:AdmissionDocuments,private readonly jobs:AdmissionJobs,private readonly integrations:ExternalAdapters,private readonly organization:ExamOrganization){}
 @Get('batches/:id/exam-organization') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') examOrganization(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.organization.organization(id,actor(req));}
 @Post('batches/:id/exam-settings') @Roles('ACADEMIC_ADMIN','OFFICER') examSettings(@Param('id',ParseIntPipe) id:number,@Body() body:SbdSettingsDto,@Req() req:ActorRequest){return this.organization.settings(id,body.MauSoBaoDanh,body.DoDaiSoBaoDanh,body.Version,actor(req));}
 @Post('batches/:id/allocate-exams') @Roles('ACADEMIC_ADMIN','OFFICER') allocateBatch(@Param('id',ParseIntPipe) id:number,@Body() body:BatchAllocationDto,@Req() req:ActorRequest){return this.organization.allocateBatch(id,body.Preview,actor(req));}
 @Get('batches/:id/attendance.pdf') @Roles('ACADEMIC_ADMIN','OFFICER') async batchAttendance(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest,@Res() res:Response){const pdf=await this.organization.batchRoster(id,actor(req));res.setHeader('Cache-Control','no-store');res.type('application/pdf').attachment('diem-danh-toan-dot.pdf').send(pdf);}
 @Get('exams/:id/attendance.pdf') async attendancePdf(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest,@Res() res:Response){const pdf=await this.organization.rosterPdf([id],actor(req));res.setHeader('Cache-Control','no-store');res.type('application/pdf').attachment('diem-danh-phong-thi.pdf').send(pdf);}
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
 @Post('applications/:id/resolve-appeal') @Roles('ACADEMIC_ADMIN','LEADER','OFFICER') resolve(@Param('id',ParseIntPipe) id:number,@Body() body:ResolveDto,@Req() req:ActorRequest){return this.service.resolveAppeal(id,body.scores,body.LyDo,actor(req));}
 @Post('quotas/:id/tie-decision') @Roles('ACADEMIC_ADMIN','OFFICER') tieDecision(@Param('id',ParseIntPipe) id:number,@Body() body:TieDecisionDto,@Req() req:ActorRequest){return this.service.decideTie(id,body.ThuTuHoSo,body.LyDo,actor(req));}
 @Post('batches/:id/rank') @Roles('ACADEMIC_ADMIN','OFFICER') rank(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.service.rank(id,actor(req));}
 @Post('batches/:id/approve') @Roles('ACADEMIC_ADMIN','OFFICER') approve(@Param('id',ParseIntPipe) id:number,@Body() body:ApproveDto,@Req() req:ActorRequest){return this.service.approve(id,body.GhiChu,actor(req));}
 @Post('applications/:id/enroll') @Roles('ACADEMIC_ADMIN','OFFICER') enroll(@Param('id',ParseIntPipe) id:number,@Body() body:EnrollDto,@Req() req:ActorRequest){return this.service.enroll(id,body.MaPhienBan,body.MaLopQuanLy??null,actor(req),false,body.MaGVHD);}
 @Get('reports') @Roles('ACADEMIC_ADMIN','OFFICER','LEADER') async report(@Query() q:ExportDto,@Req() req:ActorRequest,@Res() res:Response){const file=await this.docs.report(q.kind,q.format,actor(req),q.dot,q.template);res.setHeader('Cache-Control','no-store');res.attachment('tuyen-sinh-'+q.kind+'.'+q.format).send(file);}
 @Post('jobs/run') @Roles('ACADEMIC_ADMIN') async runJobs(){await this.jobs.tick();return {ok:true};}
}
