const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const {PDFDocument}=require('pdf-lib');
const {setup}=require('./setup-ocr.cjs');
const samples=[
 {type:'BANG_DAI_HOC',title:'BẰNG TỐT NGHIỆP - MẪU THỬ OCR',lines:['Họ và tên: Nguyễn Văn An','Ngày sinh: 02/03/2000','Số hiệu văn bằng: DEMO-2026-001','Ngày cấp: 01/06/2024','Trường cấp bằng: Đại học Mẫu','Xếp loại: Giỏi'],expected:{HoTen:'Nguyễn Văn An',NgaySinh:'2000-03-02',SoVanBang:'DEMO-2026-001',NgayCap:'2024-06-01',TruongCap:'Đại học Mẫu',XepLoai:'Giỏi'}},
 {type:'BANG_DIEM',title:'BẢNG ĐIỂM - MẪU THỬ OCR',lines:['Họ và tên: Nguyễn Văn An','Ngày sinh: 02/03/2000','Trường cấp bằng: Đại học Mẫu','Điểm trung bình tích lũy: 3.5','Xếp loại: Giỏi'],expected:{HoTen:'Nguyễn Văn An',NgaySinh:'2000-03-02',TruongCap:'Đại học Mẫu',Diem:3.5,XepLoai:'Giỏi'}},
 {type:'CHUNG_CHI_NGOAI_NGU',title:'ENGLISH CERTIFICATE - OCR TEST SAMPLE',lines:['Full name: Nguyen Van An','Date of birth: 02/03/2000','Certificate number: DEMO-IELTS-001','Date of issue: 01/10/2026','Overall band score: 6.5'],expected:{HoTen:'Nguyen Van An',NgaySinh:'2000-03-02',SoVanBang:'DEMO-IELTS-001',NgayCap:'2026-10-01',Diem:6.5}}
];
async function main(){
 await setup();
 const backend=path.resolve(__dirname,'..'),out=path.resolve(backend,'../../05_Testing/OCR_Mau');await fs.mkdir(out,{recursive:true});
 GlobalFonts.registerFromPath(path.join(backend,'src/modules/admissions/assets/BeVietnamPro-Regular.ttf'),'OcrSample');
 const {ExternalAdapters}=require('../dist/modules/admissions/infrastructure/external.adapters');
 const {ConfigService}=require('@nestjs/config'),{parseEnv}=require('node:util');let env={};try{env=parseEnv(await fs.readFile(path.join(backend,'.env'),'utf8'));}catch{}
 // Test the local path even if a provider is configured on this machine.
 const adapter=new ExternalAdapters(new ConfigService({OCR_LANG_PATH:path.resolve(backend,process.env.OCR_LANG_PATH||env.OCR_LANG_PATH||'storage/ocr')}));
 let count=0;const checks=[];
 for(const sample of samples){
  const canvas=createCanvas(2000,1450),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='black';ctx.font='38px OcrSample';ctx.fillText(sample.title,90,110);ctx.font='30px OcrSample';ctx.fillText('DỮ LIỆU HƯ CẤU - CHỈ DÙNG KIỂM THỬ ĐỒ ÁN',90,180);ctx.font='44px OcrSample';sample.lines.forEach((line,index)=>ctx.fillText(line,90,310+index*125));
  const png=canvas.toBuffer('image/png'),pdf=await PDFDocument.create(),image=await pdf.embedPng(png),page=pdf.addPage([800,580]);page.drawImage(image,{x:0,y:0,width:800,height:580});
  for(const [extension,mime,data] of [['png','image/png',png],['pdf','application/pdf',Buffer.from(await pdf.save())]]){
   await fs.writeFile(path.join(out,sample.type+'.'+extension),data);
   const result=await adapter.ocr(data,mime,sample.type);
   assert.equal(result.CanKiemTra,true,'OCR must retain human review');
   for(const [key,value] of Object.entries(sample.expected))assert.equal(result[key],value,`${sample.type}.${extension}: ${key}`);
   checks.push({file:sample.type+'.'+extension,passed:true,expected:sample.expected,actual:Object.fromEntries(Object.keys(sample.expected).map(key=>[key,result[key]]))});console.log('PASS '+sample.type+'.'+extension);count++;
  }
 }
 await fs.writeFile(path.join(out,'expected.json'),JSON.stringify(samples.map(({type,expected})=>({type,expected})),null,2)+'\n');
 await fs.writeFile(path.join(out,'ket-qua.json'),JSON.stringify({passed:count===6,finishedAt:new Date().toISOString(),scope:'Synthetic clear documents only; not a real-world accuracy benchmark',checks},null,2)+'\n');
 console.log(`Đã kiểm chứng OCR thật ${count}/6 tài liệu PNG/PDF scan. Đây là mẫu rõ nét, không phải thước đo độ chính xác hồ sơ thực tế.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
