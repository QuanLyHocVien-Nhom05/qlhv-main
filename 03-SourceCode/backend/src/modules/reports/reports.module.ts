import { BadRequestException,Controller,Get,Inject,Injectable,Module,Query,Req,Res,UseGuards } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Type } from 'class-transformer';
import { IsInt,IsOptional,Max,Min } from 'class-validator';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PageDto } from '../management/presentation/management.controller';
import { AccessGuard,Roles,type ActorRequest } from '../../shared/security/access.guard';
import { SqlServerService } from '../../shared/infrastructure/sql-server.service';
import { SPREADSHEET_WRITER,type SpreadsheetWriter } from '../../shared/application/spreadsheet.port';
import { XlsxWriterModule } from '../../shared/infrastructure/xlsx-writer.module';
type Filter={MaPhienBan?:number;search:string;page:number;limit:number};
type Kind='students'|'programs';
interface ReportRepository{options():Promise<unknown>;rows(kind:Kind,filter:Filter,all:boolean):Promise<{data:Record<string,unknown>[];total:number}>;audit(kind:Kind,filter:Filter,count:number,actor:string):Promise<void>;}
const REPORT_REPOSITORY=Symbol('REPORT_REPOSITORY');
const students=`SELECT h.MaHocVien,h.MaSoHocVien,n.HoTen,c.TenChuongTrinh,p.KhoaTuyenSinh,h.TrangThai,p.MaPhienBan,p.TinChiToiThieu,t.TinChiTichLuy,t.DiemTrungBinh FROM hoc_thuat.HocVien h JOIN danh_muc.Nguoi n ON n.MaNguoi=h.MaNguoi JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=h.MaPhienBan JOIN hoc_thuat.ChuongTrinh c ON c.MaChuongTrinh=p.MaChuongTrinh LEFT JOIN hoc_thuat.v_TienDoHocTap t ON t.MaHocVien=h.MaHocVien`;
const programs=`SELECT p.MaPhienBan,c.KyHieu,c.TenChuongTrinh,n.TenNganh,p.KhoaTuyenSinh,hp.KyHieu AS KyHieuHocPhan,k.TenHocPhan,k.SoTinChi,k.HocKyDuKien,CASE WHEN k.BatBuoc=1 THEN N'Bắt buộc' ELSE N'Tự chọn' END AS Loai FROM hoc_thuat.ChuongTrinh c JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaChuongTrinh=c.MaChuongTrinh JOIN hoc_thuat.KhungHocPhan k ON k.MaPhienBan=p.MaPhienBan JOIN hoc_thuat.HocPhan hp ON hp.MaHocPhan=k.MaHocPhan WHERE p.TrangThai='DA_DUYET'`;
@Injectable()
class SqlReportRepository implements ReportRepository{
 constructor(private readonly db:SqlServerService){}
 async options(){return(await this.db.query(`SELECT p.MaPhienBan,c.TenChuongTrinh,p.KhoaTuyenSinh FROM hoc_thuat.PhienBanChuongTrinh p JOIN hoc_thuat.ChuongTrinh c ON c.MaChuongTrinh=p.MaChuongTrinh WHERE p.TrangThai='DA_DUYET' ORDER BY c.TenChuongTrinh,p.KhoaTuyenSinh`)).recordset;}
 async rows(kind:Kind,f:Filter,all:boolean){const projection=kind==='students'?students:programs,where=`(@Version IS NULL OR MaPhienBan=@Version) AND (@Search=N'' OR TenChuongTrinh LIKE @Pattern ESCAPE N'~'${kind==='students'?" OR HoTen LIKE @Pattern ESCAPE N'~' OR MaSoHocVien LIKE @Pattern ESCAPE N'~'":''})`;
 const r=await this.db.query(`SELECT COUNT(*) AS Total FROM (${projection}) x WHERE ${where};SELECT * FROM (${projection}) x WHERE ${where} ORDER BY ${kind==='students'?'MaHocVien':'MaPhienBan,HocKyDuKien,KyHieuHocPhan'} OFFSET CAST(@Offset AS int) ROWS FETCH NEXT CAST(@Limit AS int) ROWS ONLY`,{Version:f.MaPhienBan??null,Search:f.search,Pattern:'%'+f.search.replace(/[~%_\[]/g,'~$&')+'%',Offset:all?0:(f.page-1)*f.limit,Limit:all?10001:f.limit});const sets=r.recordsets as unknown as Record<string,unknown>[][];return {data:sets[1],total:Number(sets[0][0].Total)};}
 async audit(kind:Kind,f:Filter,count:number,actor:string){await this.db.resolveStaff(actor);await this.db.query(`INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet) VALUES('HOC_THUAT','BaoCao',0,'XUAT_XLSX',@Nguoi,@ChiTiet)`,{Nguoi:actor,ChiTiet:JSON.stringify({Loai:kind,MaPhienBan:f.MaPhienBan,SoBanGhi:count})});}
}
@Injectable()
class ReportService{
 constructor(@Inject(REPORT_REPOSITORY) private readonly repository:ReportRepository,@Inject(SPREADSHEET_WRITER) private readonly writer:SpreadsheetWriter){}
 options(){return this.repository.options();}
 rows(f:Filter){return this.repository.rows('students',f,false);}
 async export(kind:Kind,f:Filter,actor:string){const result=await this.repository.rows(kind,f,true);if(result.total>10000)throw new BadRequestException('Vượt 10.000 dòng. Hãy thu hẹp bộ lọc.');const fields=kind==='students'?[['MaSoHocVien','Mã học viên'],['HoTen','Họ tên'],['TenChuongTrinh','Chương trình'],['KhoaTuyenSinh','Khóa'],['TinChiToiThieu','Tín chỉ yêu cầu'],['TinChiTichLuy','Tín chỉ tích lũy'],['DiemTrungBinh','Điểm trung bình']]:[['KyHieu','Mã chương trình'],['TenChuongTrinh','Chương trình'],['TenNganh','Ngành'],['KhoaTuyenSinh','Khóa'],['KyHieuHocPhan','Mã học phần'],['TenHocPhan','Học phần'],['SoTinChi','Tín chỉ'],['HocKyDuKien','Học kỳ'],['Loai','Loại']];const numeric=new Set(['TinChiToiThieu','TinChiTichLuy','DiemTrungBinh','SoTinChi','HocKyDuKien']);const file=await this.writer.write([{name:kind==='students'?'Tiến độ học tập':'Khung chương trình',columns:fields.map(([key,title])=>({key,title,numeric:numeric.has(key),width:30})),rows:result.data}]);await this.repository.audit(kind,f,result.data.length,actor);return file;}
}
class ReportQuery extends PageDto{@IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(2147483647) MaPhienBan?:number;}
@ApiTags('reports') @ApiBearerAuth() @Controller('reports') @UseGuards(AccessGuard) @Roles('ACADEMIC_ADMIN','LEADER','OFFICER')
class ReportController{
 constructor(private readonly service:ReportService){}
 @Get('options') options(){return this.service.options();}
 @Get('students') rows(@Query() f:ReportQuery){return this.service.rows(f);}
 @Get('students.xlsx') students(@Query() f:ReportQuery,@Req() req:ActorRequest,@Res() res:Response){return this.download('students',f,req,res);}
 @Get('programs.xlsx') programs(@Query() f:ReportQuery,@Req() req:ActorRequest,@Res() res:Response){return this.download('programs',f,req,res);}
 private async download(kind:Kind,f:ReportQuery,req:ActorRequest,res:Response){const file=await this.service.export(kind,f,req.actor.sub);res.setHeader('Cache-Control','private, no-store');res.attachment(`bao-cao-${kind}.xlsx`).type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(file);}
}
@Module({imports:[JwtModule.register({}),XlsxWriterModule],controllers:[ReportController],providers:[AccessGuard,ReportService,{provide:REPORT_REPOSITORY,useClass:SqlReportRepository}]})
export class ReportsModule{}
