import {BadRequestException,Injectable} from '@nestjs/common';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {AdmissionActor,AdmissionsService} from './admissions.service';
import {ExamService} from './exam.service';
import {allocateCandidatesSql,examLock,validCouncilSql} from '../infrastructure/exam-allocation.sql';

export function validateSbdTemplate(template:string,width:number){
 if(!Number.isInteger(width)||width<1||width>15||typeof template!=='string'||template.length>50||!template.includes('{DOT}')||template.split('{SO}').length!==2||!/^[A-Z0-9_{}-]+$/.test(template)||/[{}]/.test(template.replace(/\{(?:DOT|SO|NAM|NGANH)\}/g,'')))throw new BadRequestException('Mẫu SBD cần {DOT}, đúng một {SO}; có thể thêm {NAM}, {NGANH}, chữ in hoa, số, gạch nối/gạch dưới. Độ dài số 1–15.');
 // Reserve enough room for the largest batch/major/id values; never truncate a candidate id.
 const bound=template.replaceAll('{DOT}','X'.repeat(30)).replaceAll('{SO}','X'.repeat(15)).replaceAll('{NAM}','2026').replaceAll('{NGANH}','X'.repeat(10));
 if(bound.length>60)throw new BadRequestException('Mẫu SBD có thể vượt 60 ký tự; cần rút ngắn.');
}
@Injectable()
export class ExamOrganization{
 constructor(private readonly service:AdmissionsService,private readonly exams:ExamService){}
 async organization(dot:number,actor:AdmissionActor){await this.service.assertBatchScope(dot,actor);const r=await this.service.db.query(`SELECT MaDot,TenDot,MauSoBaoDanh,DoDaiSoBaoDanh,CONVERT(varchar(18),CONVERT(varbinary(8),Revision),1) AS Version FROM tuyen_sinh.DotTuyen WHERE MaDot=@Dot;
 SELECT *,CONVERT(varchar(18),CONVERT(varbinary(8),Revision),1) AS Version FROM tuyen_sinh.HoiDong WHERE MaDot=@Dot;
 SELECT t.*,n.HoTen FROM tuyen_sinh.ThanhVienHoiDong t JOIN tuyen_sinh.HoiDong h ON h.MaHoiDong=t.MaHoiDong JOIN nhan_su.CanBo b ON b.MaCanBo=t.MaCanBo JOIN danh_muc.Nguoi n ON n.MaNguoi=b.MaNguoi WHERE h.MaDot=@Dot;
 SELECT c.*,p.TenPhong,p.SucChua,(SELECT COUNT(*) FROM tuyen_sinh.PhanPhong x WHERE x.MaCa=c.MaCa) AS DaPhan,CONVERT(varchar(18),CONVERT(varbinary(8),c.Revision),1) AS Version FROM tuyen_sinh.CaThi c JOIN tuyen_sinh.PhongThi p ON p.MaPhong=c.MaPhong WHERE c.MaDot=@Dot ORDER BY c.BatDau,p.SucChua DESC,c.MaCa`,{Dot:dot});const sets=r.recordsets as unknown as any[][];return {batch:sets[0][0],councils:sets[1].map(h=>({...h,members:sets[2].filter(t=>t.MaHoiDong===h.MaHoiDong)})),exams:sets[3]};}
 async settings(dot:number,template:string,width:number,version:string,actor:AdmissionActor){await this.service.assertBatchScope(dot,actor);validateSbdTemplate(template,width);await this.service.db.query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;${examLock}
 IF EXISTS(SELECT 1 FROM tuyen_sinh.PhanPhong p JOIN tuyen_sinh.CaThi c ON c.MaCa=p.MaCa WHERE c.MaDot=@Dot) THROW 51091,N'Đã cấp SBD, không thay cấu trúc số báo danh.',1;
 UPDATE tuyen_sinh.DotTuyen SET MauSoBaoDanh=@Template,DoDaiSoBaoDanh=@Width WHERE MaDot=@Dot AND Revision=TRY_CONVERT(binary(8),@Version,1);IF @@ROWCOUNT<>1 THROW 51091,N'Đợt đã thay đổi. Tải lại trước khi lưu.',1;
 COMMIT;END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Dot:dot,Template:template,Width:width,Version:version});await this.service.audit(actor,'CAU_HINH_SBD',dot,{template,width});return {ok:true};}
 async allocateBatch(dot:number,preview:boolean,actor:AdmissionActor){await this.service.assertBatchScope(dot,actor);
  const r=await this.service.db.query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;${examLock}
  IF (SELECT COUNT(*) FROM tuyen_sinh.CaThi WHERE MaDot=@Batch AND TrangThai='NHAP') NOT BETWEEN 1 AND 100 THROW 51091,N'Cần 1–100 ca nháp để phân phòng toàn đợt.',1;
  IF EXISTS(SELECT 1 FROM tuyen_sinh.CaThi WHERE MaDot=@Batch AND TrangThai<>'HUY' AND ThanhPhan='TONG_HOP') AND EXISTS(SELECT 1 FROM tuyen_sinh.CaThi WHERE MaDot=@Batch AND TrangThai<>'HUY' AND ThanhPhan<>'TONG_HOP') THROW 51091,N'Chọn thống nhất bài tổng hợp hoặc các bài độc lập trong đợt trước khi xếp tự động.',1;
  DECLARE @Result TABLE(MaCa bigint,DaPhan int,LyDo nvarchar(300));DECLARE @Id bigint,@Added int,@Quota int=NULL;
  DECLARE slots CURSOR LOCAL FAST_FORWARD FOR SELECT c.MaCa FROM tuyen_sinh.CaThi c WITH(UPDLOCK,HOLDLOCK) JOIN tuyen_sinh.PhongThi p ON p.MaPhong=c.MaPhong WHERE c.MaDot=@Batch AND c.TrangThai='NHAP' ORDER BY CASE c.ThanhPhan WHEN 'CO_SO' THEN 0 WHEN 'CHUYEN_NGANH' THEN 1 ELSE 2 END,c.BatDau,p.SucChua DESC,c.MaCa;
  OPEN slots;FETCH NEXT FROM slots INTO @Id;
  WHILE @@FETCH_STATUS=0 BEGIN
   ${validCouncilSql}
   IF NOT EXISTS(SELECT 1 FROM tuyen_sinh.PhanCong WHERE MaCa=@Id AND VaiTro IN('COI_THI','CHU_TICH')) OR NOT EXISTS(SELECT 1 FROM tuyen_sinh.PhanCong WHERE MaCa=@Id AND VaiTro='CHAM_THI') THROW 51091,N'Cần phân công coi/chủ tịch và chấm thi cho từng ca.',1;
   IF EXISTS(SELECT 1 FROM tuyen_sinh.CaThi a JOIN tuyen_sinh.CaThi b ON b.MaCa<>a.MaCa AND b.TrangThai<>'HUY' AND b.BatDau<a.KetThuc AND b.KetThuc>a.BatDau WHERE a.MaCa=@Id AND(b.TrangThai='CONG_BO' OR EXISTS(SELECT 1 FROM tuyen_sinh.PhanPhong p WHERE p.MaCa=b.MaCa)) AND(a.MaPhong=b.MaPhong OR EXISTS(SELECT 1 FROM tuyen_sinh.PhanCong x JOIN tuyen_sinh.PhanCong y ON y.MaCanBo=x.MaCanBo WHERE x.MaCa=a.MaCa AND y.MaCa=b.MaCa)))
    INSERT @Result VALUES(@Id,0,N'Bỏ qua: trùng phòng hoặc cán bộ với ca đã có thí sinh/đã công bố.');
   ELSE BEGIN ${allocateCandidatesSql} INSERT @Result VALUES(@Id,@Added,N'Đã xét theo sức chứa và lịch thí sinh.');END;
   FETCH NEXT FROM slots INTO @Id;
  END;CLOSE slots;DEALLOCATE slots;
  SELECT r.*,c.TenCa,c.ThanhPhan,p.TenPhong,p.SucChua,c.BatDau,c.KetThuc,(SELECT COUNT(*) FROM tuyen_sinh.PhanPhong x WHERE x.MaCa=c.MaCa) AS TongDaPhan FROM @Result r JOIN tuyen_sinh.CaThi c ON c.MaCa=r.MaCa JOIN tuyen_sinh.PhongThi p ON p.MaPhong=c.MaPhong;
  SELECT DISTINCT h.MaHoSo,h.SoHoSo,c.ThanhPhan,N'Chưa có chỗ phù hợp; kiểm tra sức chứa, ca thi và xung đột lịch.' AS LyDo FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN danh_muc.Nganh n ON n.MaNganh=q.MaNganh JOIN tuyen_sinh.CaThi c ON c.MaDot=q.MaDot AND c.TrangThai<>'HUY' AND(c.MaChiTieu IS NULL OR c.MaChiTieu=q.MaChiTieu) AND(c.HinhThuc<>'DE_CUONG' OR q.TrinhDo='TIEN_SI') WHERE q.MaDot=@Batch AND h.TrangThai='DU_DIEU_KIEN' AND(@Admin=1 OR n.MaDonVi IN(SELECT MaDonVi FROM nhan_su.fn_PhamViDonVi(@Subject))) AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.PhanPhong p WHERE p.MaHoSo=h.MaHoSo AND(p.ThanhPhan=c.ThanhPhan OR p.ThanhPhan='TONG_HOP'));
  IF @Preview=1 ROLLBACK;ELSE COMMIT;
  END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Batch:dot,Preview:preview,Admin:actor.roles.includes('ACADEMIC_ADMIN'),Subject:actor.sub});
  const sets=r.recordsets as unknown as any[][];if(!preview)await this.service.audit(actor,'PHAN_PHONG_TOAN_DOT',dot,{soCa:sets[0].length,chuaXep:sets[1].length});return {preview,exams:sets[0],unassigned:sets[1]};
 }
 async rosterPdf(ids:number[],actor:AdmissionActor){
  if(!ids.length||ids.length>100)throw new BadRequestException('Chọn 1–100 ca thi.');
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(await readFile(join(__dirname,'../assets/BeVietnamPro-Regular.ttf')));
  for(const id of ids){if(!actor.roles.includes('LECTURER'))await this.exams.scope(id,actor);const rows=await this.exams.roster(id,actor);const meta=(await this.service.db.query<any>(`SELECT c.*,p.TenPhong,d.TenDot,h.TenHoiDong,h.SoQuyetDinh FROM tuyen_sinh.CaThi c JOIN tuyen_sinh.PhongThi p ON p.MaPhong=c.MaPhong JOIN tuyen_sinh.DotTuyen d ON d.MaDot=c.MaDot LEFT JOIN tuyen_sinh.HoiDong h ON h.MaHoiDong=c.MaHoiDong WHERE c.MaCa=@Id`,{Id:id})).recordset[0];
   let page=pdf.addPage([842,595]),y=425,index=0;
   const draw=(text:string,x:number,at:number,size=10)=>{const max=x===85?175:x===275?250:760;const fitted=Math.min(size,max/Math.max(1,font.widthOfTextAtSize(text,size))*size);page.drawText(text,{x,y:at,size:Math.max(5,fitted),font,color:rgb(0,0,0)});};
   const header=()=>{draw('DANH SÁCH ĐIỂM DANH PHÒNG THI',40,555,16);draw(`${meta.TenDot} · ${meta.TenCa} · ${meta.ThanhPhan}`,40,530);draw(`Phòng: ${meta.TenPhong} · ${new Date(meta.BatDau).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}`,40,510);draw(`Hội đồng: ${meta.TenHoiDong??'Chưa liên kết'} · Quyết định: ${meta.SoQuyetDinh??'—'}`,40,490);['STT','Số báo danh','Họ tên','Có mặt / Vắng','Chữ ký thí sinh'].forEach((t,i)=>draw(t,[40,85,275,545,665][i],460));};header();
   for(const row of rows as any[]){if(y<100){draw('Cán bộ coi thi 1: __________________    Cán bộ coi thi 2: __________________',40,55);page=pdf.addPage([842,595]);y=425;header();}index++;[String(index),row.SoBaoDanh,row.HoTen,row.CoMat===null?'':row.CoMat?'Có mặt':'Vắng','________________'].forEach((v,i)=>draw(String(v).slice(0,i===2?40:60),[40,85,275,545,665][i],y));page.drawLine({start:{x:40,y:y-8},end:{x:800,y:y-8},thickness:.3,color:rgb(.6,.6,.6)});y-=28;}
   if(!rows.length)draw('Chưa có thí sinh được phân vào ca.',40,y);draw('Cán bộ coi thi 1: __________________    Cán bộ coi thi 2: __________________',40,55);
  }
  await this.service.audit(actor,'XUAT_DIEM_DANH',ids[0],{caThi:ids});return Buffer.from(await pdf.save());
 }
 async batchRoster(dot:number,actor:AdmissionActor){await this.service.assertBatchScope(dot,actor);const ids=(await this.service.db.query<any>("SELECT MaCa FROM tuyen_sinh.CaThi WHERE MaDot=@Dot AND TrangThai='CONG_BO' ORDER BY BatDau,MaPhong",{Dot:dot})).recordset.map(r=>Number(r.MaCa));return this.rosterPdf(ids,actor);}
}
