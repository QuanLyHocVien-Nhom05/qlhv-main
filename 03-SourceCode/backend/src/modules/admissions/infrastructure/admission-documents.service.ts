import {ForbiddenException,Inject,Injectable,ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import {zipSync,strToU8} from 'fflate';
import {AdmissionsService,AdmissionActor} from '../application/admissions.service';
import {reportColumns} from '../domain/report';
import {requireAguBiography,aguBiographySource,biographyLabels,relativeLabels} from '../domain/agu-biography';
import {SPREADSHEET_WRITER,SpreadsheetWriter} from '../../../shared/application/spreadsheet.port';
@Injectable()
export class AdmissionDocuments{
 constructor(private readonly service:AdmissionsService,private readonly config:ConfigService,@Inject(SPREADSHEET_WRITER) private readonly writer:SpreadsheetWriter){}
 async biography(id:number,actor:AdmissionActor){
  const h=await this.service.get(id,actor),p=h.profile,b=requireAguBiography(p);
  const show=(v:unknown)=>v===null||v===undefined||v===''?'Chưa kê khai/không áp dụng':String(v);
  const lines=[
   'Bản kê khai điện tử AGU 2026 - chưa có xác nhận.',
   '','','','','',
   'I. BẢN THÂN',`Họ và tên: ${p.HoTen.toLocaleUpperCase('vi-VN')}`,
   `Giới tính: ${{NAM:'Nam',NU:'Nữ',KHAC:'Khác'}[b.GioiTinh]??b.GioiTinh}`,
   `Ngày sinh: ${p.NgaySinh}`,`Nơi sinh: ${b.NoiSinh}`,`Quê quán: ${b.QueQuan}`,
   `Dân tộc: ${b.DanToc} · Tôn giáo: ${b.TonGiao}`,`Hộ khẩu thường trú: ${b.HoKhauThuongTru}`,
   `Điện thoại: ${p.DienThoai}`,`Trình độ văn hóa: ${b.TrinhDoVanHoa}`,
   `Trình độ ngoại ngữ: ${b.TrinhDoNgoaiNgu} · Tin học: ${b.TrinhDoTinHoc}`,
   `Trường đào tạo: ${p.TruongCapBang} · Ngành: ${p.NganhTotNghiep}`,
   `Hình thức đào tạo: ${b.HinhThucDaoTao} · Năm tốt nghiệp: ${b.NamTotNghiep}`,
   `Nghề nghiệp: ${b.NgheNghiep} · Đơn vị công tác: ${show(p.NoiCongTac)}`,
   ...['ChucVu','DiaChiCoQuan','NgayBatDauCongTac','SoNamCongTac','NgayVaoDoan','NoiVaoDoan','NgayVaoDang','NoiVaoDang','DiaChiLienHe'].map(k=>`${biographyLabels[k]}: ${show(b[k as keyof typeof b])}`),
   'Quá trình hoạt động:',...b.QuaTrinhHoatDong.map(r=>`${r.TuThang} - ${r.DenThang||'Hiện nay'} | ${r.CongViec} | ${r.DonViCongTac} | ${show(r.ChucVu)}`),
   `Khen thưởng: ${show(b.KhenThuong)}`,`Kỷ luật: ${show(b.KyLuat)}`,'II. GIA ĐÌNH',
   ...b.GiaDinh.flatMap(r=>[`${relativeLabels[r.QuanHe]}: ${r.HoTen} · Năm sinh: ${show(r.NamSinh)} · Tuổi: ${show(r.Tuoi)}`,`Nghề nghiệp: ${show(r.NgheNghiep)} · Nơi làm việc: ${show(r.NoiLamViec)}`,`Nơi ở hiện nay: ${show(r.NoiOHienNay)}`]),
   `Ghi chú gia đình: ${show(b.GhiChuGiaDinh)}`,'LỜI CAM ĐOAN',
   'Tôi cam đoan thông tin đã khai là đúng sự thật và chịu trách nhiệm về lời khai.',
   'Ngày ........ tháng ........ năm ........','Người khai ký và ghi rõ họ tên: ............................................',
   'XÁC NHẬN CỦA CƠ QUAN QUẢN LÝ / ĐỊA PHƯƠNG: ............................................',
   'Dán ảnh 3x4, ký và xin xác nhận theo yêu cầu của trường. Bản dữ liệu tự khai này không xác nhận thay cơ quan.',
   `Mã hồ sơ: ${h.SoHoSo} · Nguồn tham chiếu: ${aguBiographySource.sourceUrl}`,
  ];
  const output=await this.pdf('SƠ YẾU LÝ LỊCH',lines),document=await PDFDocument.load(output);document.registerFontkit(fontkit);
  const font=await document.embedFont(await readFile(join(__dirname,'../assets/BeVietnamPro-Regular.ttf'))),page=document.getPages()[0];
  page.drawRectangle({x:440,y:630,width:85,height:113,borderWidth:1,borderColor:rgb(.3,.3,.3)});
  page.drawText('Ảnh 3x4',{x:449,y:684,size:10,font});
  await this.service.audit(actor,'XUAT_SO_YEU_LY_LICH_AGU',id,{PhienBan:b.PhienBan});
  return Buffer.from(await document.save());
 }
 private sign(payload:string){return createHmac('sha256',this.config.getOrThrow<string>('JWT_SECRET')).update('admission-letter\0'+payload).digest('base64url');}
 private token(id:number,kind:string){const payload=Buffer.from(JSON.stringify({id,kind,exp:Date.now()+90*86400000})).toString('base64url');return payload+'.'+this.sign(payload);}
 async verify(token:string){if(token.length>1000)return {valid:false};const [payload,sig]=token.split('.');if(!payload||!sig||!/^[A-Za-z0-9_-]{43}$/.test(sig)||!/^[A-Za-z0-9_-]+$/.test(payload))return {valid:false};const expected=this.sign(payload);if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return {valid:false};try{const value=JSON.parse(Buffer.from(payload,'base64url').toString());if(value.exp<Date.now()||!Number.isSafeInteger(value.id)||!['invite','result'].includes(value.kind))return {valid:false};const row=(await this.service.db.query<any>(`SELECT h.SoHoSo,h.TrangThai,d.TrangThai AS DotTrangThai FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu c ON c.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=c.MaDot WHERE h.MaHoSo=@Id`,{Id:value.id})).recordset[0];if(!row)return {valid:false};const active=value.kind==='result'?row.DotTrangThai==='CONG_BO'&&['TRUNG_TUYEN','XAC_NHAN_NHAP_HOC','DA_BAN_GIAO'].includes(row.TrangThai):(await this.service.db.query(`SELECT 1 AS Active FROM tuyen_sinh.PhanPhong p JOIN tuyen_sinh.CaThi c ON c.MaCa=p.MaCa WHERE p.MaHoSo=@Id AND c.TrangThai='CONG_BO'`,{Id:value.id})).recordset.length>0;return active?{valid:true,SoHoSo:row.SoHoSo,LoaiGiayBao:value.kind,message:'Mã xác thực nguồn phát hành; không thay thế xác minh chữ ký số PKI.'}:{valid:false};}catch{return {valid:false};}}
 async pdf(title:string,lines:string[],qr?:string){const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(await readFile(join(__dirname,'../assets/BeVietnamPro-Regular.ttf')));let page=doc.addPage([595,842]),y=790;const draw=(line:string,size=10)=>{const words=line.split(/\s+/);let current='';for(const word of words){if(font.widthOfTextAtSize((current?' ':'')+current+word,size)>490&&current){if(y<65){page=doc.addPage([595,842]);y=790;}page.drawText(current,{x:50,y,font,size,color:rgb(.1,.2,.2)});y-=18;current=word;}else current+=(current?' ':'')+word;}if(y<65){page=doc.addPage([595,842]);y=790;}page.drawText(current,{x:50,y,font,size});y-=24;};draw(title,16);for(const line of lines)draw(line);if(qr){const png=await doc.embedPng(await QRCode.toBuffer(qr));if(y<180){page=doc.addPage([595,842]);y=790;}page.drawImage(png,{x:50,y:y-120,width:110,height:110});}return Buffer.from(await doc.save());}
 async letter(id:number,kind:string,actor:AdmissionActor){const h=await this.service.get(id,actor);if(kind==='invite'&&!h.schedule.length||kind==='result'&&!(h.TrangThaiDot==='CONG_BO'&&['TRUNG_TUYEN','XAC_NHAN_NHAP_HOC','DA_BAN_GIAO'].includes(h.TrangThai))||!['invite','result'].includes(kind))throw new ForbiddenException('Giấy báo chưa được phát hành.');
  const base=this.config.get<string>('PUBLIC_WEB_ORIGIN')||this.config.get<string>('FRONTEND_ORIGIN')||'http://localhost:3000';const qr=base.replace(/\/$/,'')+'/xac-thuc-giay-bao?ma='+encodeURIComponent(this.token(id,kind));const lines=[`Số hồ sơ: ${h.SoHoSo}`,`Họ tên: ${h.profile.HoTen}`,`Đợt: ${h.TenDot}`,`Ngành: ${h.TenNganh} · ${h.TrinhDo}`,kind==='invite'?h.schedule.map((s:any)=>`SBD: ${s.SoBaoDanh} · ${s.TenCa} · Phòng: ${s.TenPhong} · ${new Date(s.BatDau).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}`).join(' | '):`Kết quả: Trúng tuyển · Hạn nhập học: ${new Date(h.HanNhapHoc).toLocaleDateString('vi-VN')}`,kind==='invite'?`Thời gian: ${new Date(h.schedule[0].BatDau).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}`:'Xác nhận nhập học trên cổng thông tin và hoàn tất khoản phí theo cấu hình.','Bản điện tử phục vụ đồ án; QR dùng để xác thực nguồn phát hành, không phải chữ ký số.'];let pdf=await this.pdf(kind==='invite'?'GIẤY BÁO DỰ THI / ĐÁNH GIÁ':'THÔNG BÁO TRÚNG TUYỂN',lines,qr);return pdf;}
 async report(kind:string,format:string,actor:AdmissionActor,dot?:number,template?:number){if(!actor.roles.some(r=>['ACADEMIC_ADMIN','OFFICER','LEADER'].includes(r)))throw new ForbiddenException();if(!['applications','accepted','revenue'].includes(kind)||!['xlsx','pdf','docx'].includes(format))throw new ForbiddenException();
  const r=await this.service.db.query<any>(`SELECT h.SoHoSo,u.HoTen,d.TenDot,n.TenNganh,c.TrinhDo,c.PhuongThuc,h.TrangThai,COALESCE(g.XetTuyen,0) AS LePhiDaThu,COALESCE(g.NhapHoc,0) AS PhiNhapHocDaThu FROM tuyen_sinh.HoSo h JOIN danh_muc.Nguoi u ON u.MaNguoi=h.MaNguoi JOIN tuyen_sinh.ChiTieu c ON c.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=c.MaDot JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh OUTER APPLY(SELECT SUM(CASE WHEN LoaiPhi='XET_TUYEN' THEN SoTien ELSE 0 END) AS XetTuyen,SUM(CASE WHEN LoaiPhi='NHAP_HOC' THEN SoTien ELSE 0 END) AS NhapHoc FROM tuyen_sinh.GiaoDich WHERE MaHoSo=h.MaHoSo AND TrangThai='DA_TT' AND LaMoPhong=0) g WHERE (@Dot IS NULL OR c.MaDot=@Dot) AND(@Admin=1 OR n.MaDonVi IN(SELECT MaDonVi FROM nhan_su.fn_PhamViDonVi(@Actor))) ${kind==='accepted'?"AND h.TrangThai IN('TRUNG_TUYEN','XAC_NHAN_NHAP_HOC','DA_BAN_GIAO') AND d.TrangThai='CONG_BO'":''} ORDER BY h.MaHoSo OFFSET 0 ROWS FETCH NEXT 10001 ROWS ONLY`,{Dot:dot??null,Admin:actor.roles.includes('ACADEMIC_ADMIN'),Actor:actor.sub});if(r.recordset.length>10000||format==='pdf'&&r.recordset.length>1000)throw new ServiceUnavailableException('Thu hẹp bộ lọc trước khi xuất (PDF tối đa 1.000 dòng; Excel/Word 10.000 dòng).');
  const model=template?(await this.service.db.query<any>('SELECT * FROM tuyen_sinh.MauBaoCao WHERE MaMau=@Id AND TrangThai=\'DA_DUYET\' AND Loai=@Kind',{Id:template,Kind:kind})).recordset[0]:null;if(template&&!model)throw new ForbiddenException('Mẫu chưa được duyệt hoặc không đúng loại báo cáo.');
  const columns=model?reportColumns(model.CauHinhCot):[['SoHoSo','Số hồ sơ'],['HoTen','Họ tên'],['TenDot','Đợt'],['TenNganh','Ngành'],['PhuongThuc','Phương thức'],['TrangThai','Trạng thái'],...(kind==='revenue'?[['LePhiDaThu','Lệ phí đã thu'],['PhiNhapHocDaThu','Phí nhập học đã thu']]:[])];await this.service.audit(actor,'XUAT_BAO_CAO_TUYEN_SINH',dot??0,{Loai:kind,DinhDang:format,SoDong:r.recordset.length});
  if(format==='xlsx')return this.writer.write([{name:'Tuyển sinh đồ án',columns:columns.map(([key,title])=>({key,title,numeric:key.endsWith('DaThu')})),rows:r.recordset}]);
  const title='Báo cáo đồ án tuyển sinh · '+(model?model.TieuDe+' · '+model.SoVanBan:({applications:'Danh sách hồ sơ',accepted:'Danh sách trúng tuyển',revenue:'Doanh thu thực tế'} as Record<string,string>)[kind]),lines=r.recordset.map(row=>columns.map(([key,name])=>name+': '+(row[key]??'—')).join(' | '));if(format==='pdf')return this.pdf(title,lines);
  const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const paragraph=(s:string)=>`<w:p><w:r><w:t xml:space="preserve">${esc(s)}</w:t></w:r></w:p>`;
  return Buffer.from(zipSync({'[Content_Types].xml':strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),'_rels/.rels':strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),'word/document.xml':strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraph(title)+lines.map(paragraph).join('')}<w:sectPr/></w:body></w:document>`)}));
 }
}
