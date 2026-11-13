import {BadRequestException} from '@nestjs/common';
export function reportColumns(json:string):[string,string][]{
 let rows:unknown;try{rows=JSON.parse(json);}catch{throw new BadRequestException('Cấu hình cột phải là JSON hợp lệ.');}
 const allowed=['SoHoSo','HoTen','TenDot','TenNganh','TrinhDo','PhuongThuc','TrangThai','LePhiDaThu','PhiNhapHocDaThu'];
 if(!Array.isArray(rows)||rows.length<1||rows.length>allowed.length)throw new BadRequestException('Số cột báo cáo không hợp lệ.');
 const keys=new Set<string>();return rows.map(row=>{if(!row||typeof row!=='object'||!allowed.includes(row.key)||keys.has(row.key)||typeof row.title!=='string'||!row.title.trim()||row.title.trim().length>150||Object.keys(row).some(k=>!['key','title'].includes(k)))throw new BadRequestException('Cột báo cáo không hợp lệ hoặc bị trùng.');keys.add(row.key);return [row.key,row.title.trim()];});
}
