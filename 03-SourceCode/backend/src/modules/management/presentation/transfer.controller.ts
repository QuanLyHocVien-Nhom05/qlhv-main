import {BadRequestException,Body,Controller,ForbiddenException,Get,Inject,Param,Post,Query,Req,Res,UploadedFile,UseGuards,UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {IsArray,ArrayMaxSize,ArrayMinSize} from 'class-validator';
import readXlsxFile from 'read-excel-file/node';
import type {Response} from 'express';
import {AccessGuard,Roles,ActorRequest} from '../../../shared/security/access.guard';
import {canReadResource,canWriteResource,staffRoles} from '../../../shared/security/roles';
import {SPREADSHEET_WRITER,SpreadsheetWriter} from '../../../shared/application/spreadsheet.port';
import {SqlServerService} from '../../../shared/infrastructure/sql-server.service';
import {SqlManagementRepository} from '../infrastructure/sql-management.repository';
import {resources} from '../infrastructure/resources';
import {validateFields} from '../domain/resource';
import {PageDto} from './management.controller';
class ImportDto{@IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) rows!:Record<string,unknown>[];}
@Controller('management') @UseGuards(AccessGuard) @Roles(...staffRoles)
export class TransferController{
 constructor(private readonly repository:SqlManagementRepository,private readonly db:SqlServerService,@Inject(SPREADSHEET_WRITER) private readonly writer:SpreadsheetWriter){}
 private definition(key:string){const r=resources.find(r=>r.key===key);if(!r)throw new BadRequestException('Danh mục không tồn tại.');return r;}
 private importable(key:string,roles:string[]){if(!['units','majors','courses','students','classes','cohorts','settings'].includes(key)||!canWriteResource(roles,key,key==='settings'?'edit':null))throw new ForbiddenException();const r=this.definition(key);return key==='settings'?{...r,fields:r.actions!.find(a=>a.key==='edit')!.fields,insert:r.actions!.find(a=>a.key==='edit')!.sql}:r;}
 @Get(':resource/export.xlsx') async export(@Param('resource') key:string,@Query() q:PageDto,@Req() req:ActorRequest,@Res() res:Response){
  if(!canReadResource(req.actor.roles,key))throw new ForbiddenException();const r=this.definition(key);let rows:Record<string,unknown>[]=[];
  for(let page=1;page<=100;page++){const result=await this.repository.list(key,page,100,q.search,q.status,req.actor,q.unit);if(Number(result.total)>10000)throw new BadRequestException('Tối đa 10.000 dòng; hãy thu hẹp bộ lọc.');rows.push(...result.data);if(rows.length>=Number(result.total))break;}
  const file=await this.writer.write([{name:'Danh mục',columns:r.columns.map(k=>({key:k,title:k})),rows}]);await this.db.query(`INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,DiaChiIP) VALUES('HE_THONG',@Key,0,'XUAT_XLSX',@Nguoi,@IP)`,{Key:key,Nguoi:req.actor.sub,IP:req.ip});res.setHeader('Cache-Control','no-store');res.attachment(key+'.xlsx').send(file);
 }
 @Get(':resource/import-template.xlsx') async template(@Param('resource') key:string,@Req() req:ActorRequest,@Res() res:Response){const r=this.importable(key,req.actor.roles);const rows=key==='settings'?(await this.repository.list(key,1,1,'',undefined,req.actor)).data:[];const file=await this.writer.write([{name:'Nhập dữ liệu',columns:r.fields.map(f=>({key:f.key,title:f.key,numeric:f.type==='number'})),rows}]);res.attachment(key+'-nhap.xlsx').send(file);}
 @Post(':resource/import/preview') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:2*1024*1024,files:1}}))
 async preview(@Param('resource') key:string,@Req() req:ActorRequest,@UploadedFile() file?:{buffer:Buffer}){
  const r=this.importable(key,req.actor.roles);if(!file)throw new BadRequestException('Chọn tệp .xlsx.');let sheets;try{sheets=await readXlsxFile(file.buffer);}catch{throw new BadRequestException('Không đọc được tệp Excel.');}
  const data=sheets[0]?.data??[];if(data.length<2||data.length>101)throw new BadRequestException('Tệp phải có 1–100 dòng dữ liệu.');const headers=data[0].map(String);if(new Set(headers).size!==headers.length||headers.some(k=>!r.fields.some(f=>f.key===k)))throw new BadRequestException('Cột không hợp lệ; hãy dùng tệp mẫu.');
  return {rows:data.slice(1).map((cells,index)=>{try{const values=Object.fromEntries(headers.map((k,i)=>{const f=r.fields.find(f=>f.key===k)!,v=cells[i];return [k,f.type==='date'&&v instanceof Date?v.toISOString().slice(0,10):v];}));return {line:index+2,values:validateFields(r.fields,values)};}catch(e){return {line:index+2,error:e instanceof Error?e.message:'Dòng không hợp lệ'};}})};
 }
 @Post(':resource/import') async import(@Param('resource') key:string,@Body() body:ImportDto,@Req() req:ActorRequest){
  const r=this.importable(key,req.actor.roles),actor=await this.db.resolveStaff(req.actor.sub);let statement='',parameters:Record<string,unknown>={};
  if(key==='settings'&&body.rows.length!==1)throw new BadRequestException('Cấu hình chỉ có một dòng dữ liệu.');
  body.rows.forEach((input,i)=>{if(!input||typeof input!=='object'||Array.isArray(input))throw new BadRequestException('Dữ liệu dòng không hợp lệ.');const values=validateFields(r.fields,input);const rename=(s:string)=>s.replace(/(?<!@)@([A-Za-z][A-Za-z0-9_]*)/g,(_,k)=>'@'+k+'_'+i);statement+=rename(r.insert!)+';\n';for(const [k,v]of Object.entries({...values,Id:1,CanBo:actor.MaCanBo,Nguoi:actor.MaNguoi}))parameters[k+'_'+i]=v;});
  await this.db.query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;${statement}
  INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet) VALUES('HE_THONG',@Key,0,'NHAP_EXCEL',@Actor,@Detail);COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{...parameters,Key:key,Actor:req.actor.sub,Detail:JSON.stringify({SoDong:body.rows.length})});return {message:`Đã nhập ${body.rows.length} dòng.`};
 }
}
