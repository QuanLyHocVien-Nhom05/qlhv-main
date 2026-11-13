import {BadRequestException} from '@nestjs/common';
export const documentTypes=['BANG_DAI_HOC','BANG_DIEM','CHUNG_CHI_NGOAI_NGU','LY_LICH_KHOA_HOC','GIAY_KHAM_SUC_KHOE','DONG_Y_CO_QUAN','DE_CUONG'] as const;
export type Profile={HoTen:string;NgaySinh:string;SoGiayTo:string;DienThoai:string;TruongCapBang:string;NganhTotNghiep:string;XepLoai:string;Gpa:number;ThangGpa:4|10;NoiCongTac:string;DoiTuongUuTien:string;TenChungChi:string;DiemNgoaiNgu:number;NgayCapChungChi:string;TenDeCuong:string};
export type Scores={CoSo:number;ChuyenNganh:number;NgoaiNgu:number;UuTien:number;Tong:number;Gpa:number};
export const reviewReasons=[
 {code:'TAI_LIEU_MO',label:'Tài liệu bị mờ hoặc không đọc được'},
 {code:'THIEU_XAC_NHAN',label:'Tài liệu thiếu dấu hoặc xác nhận'},
 {code:'THIEU_MINH_CHUNG',label:'Thiếu tài liệu minh chứng bắt buộc'},
 {code:'SAI_THONG_TIN',label:'Thông tin khai báo không khớp minh chứng'},
 {code:'HET_HIEU_LUC',label:'Chứng chỉ hoặc giấy tờ đã hết hiệu lực'},
] as const;
export function reviewReason(result:string,code:string|undefined,note:string,catalog:readonly {code:string;label:string}[]=reviewReasons){
 const reason=catalog.find(r=>r.code===code);
 if(code&&!reason||result==='CAN_BO_SUNG'&&!reason)throw new BadRequestException('Chọn mẫu lý do yêu cầu bổ sung hợp lệ.');
 if(typeof note!=='string'||note.trim().length<5||note.trim().length>2000)throw new BadRequestException('Nội dung thẩm định cần từ 5 đến 2.000 ký tự.');
 const text=reason?`${reason.label}: ${note.trim()}`:note.trim();
 if(text.length>2000)throw new BadRequestException('Lý do và nội dung vượt 2.000 ký tự.');
 return text;
}
export function validateProfile(input:unknown):Profile{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new BadRequestException('Hồ sơ không hợp lệ.');const p=input as Record<string,unknown>;
 const keys=['HoTen','NgaySinh','SoGiayTo','DienThoai','TruongCapBang','NganhTotNghiep','XepLoai','Gpa','ThangGpa','NoiCongTac','DoiTuongUuTien','TenChungChi','DiemNgoaiNgu','NgayCapChungChi','TenDeCuong'];if(Object.keys(p).some(k=>!keys.includes(k)))throw new BadRequestException('Trường hồ sơ không được phép.');
 const required=['HoTen','NgaySinh','SoGiayTo','DienThoai','TruongCapBang','NganhTotNghiep','XepLoai','TenChungChi','NgayCapChungChi'];
 for(const k of keys.filter(k=>!['Gpa','ThangGpa','DiemNgoaiNgu'].includes(k))){if(typeof p[k]!=='string'||String(p[k]).length>500||required.includes(k)&&!String(p[k]).trim())throw new BadRequestException('Thông tin không hợp lệ: '+k);p[k]=String(p[k]).trim();}
 if(!/^[A-Z0-9]{6,20}$/i.test(String(p.SoGiayTo))||!/^\+?[0-9 ()-]{8,20}$/.test(String(p.DienThoai)))throw new BadRequestException('CCCD/hộ chiếu hoặc điện thoại không hợp lệ.');
 for(const k of ['NgaySinh','NgayCapChungChi'])if(!/^\d{4}-\d{2}-\d{2}$/.test(String(p[k]))||!Number.isFinite(Date.parse(String(p[k])))||new Date(String(p[k])).toISOString().slice(0,10)!==p[k]||String(p[k])>new Date().toISOString().slice(0,10))throw new BadRequestException('Ngày khai báo không hợp lệ.');
 if(!['TRUNG_BINH','KHA','GIOI','XUAT_SAC'].includes(String(p.XepLoai)))throw new BadRequestException('Xếp loại tốt nghiệp không hợp lệ.');
 if(![4,10].includes(p.ThangGpa as number)||typeof p.Gpa!=='number'||!Number.isFinite(p.Gpa)||p.Gpa<0||p.Gpa>Number(p.ThangGpa)||typeof p.DiemNgoaiNgu!=='number'||!Number.isFinite(p.DiemNgoaiNgu)||p.DiemNgoaiNgu<0||p.DiemNgoaiNgu>1000)throw new BadRequestException('GPA hoặc điểm ngoại ngữ không hợp lệ.');return p as unknown as Profile;
}
export function calculateScores(input:unknown,rule:Record<string,unknown>,gpa:number):Scores{
 const p=input as Record<string,unknown>;if(!p||typeof p!=='object'||Object.keys(p).sort().join(',')!=='ChuyenNganh,CoSo,NgoaiNgu,UuTien')throw new BadRequestException('Cần bốn thành phần điểm.');
 for(const k of ['CoSo','ChuyenNganh','NgoaiNgu','UuTien'])if(typeof p[k]!=='number'||!Number.isFinite(p[k])||Number(p[k])<0||Number(p[k])>10)throw new BadRequestException('Điểm phải từ 0 đến 10.');
 const total=Number(p.CoSo)*Number(rule.HeSoCoSo)+Number(p.ChuyenNganh)*Number(rule.HeSoChuyenNganh)+Number(p.NgoaiNgu)*Number(rule.HeSoNgoaiNgu)+Number(p.UuTien)*Number(rule.HeSoUuTien);
 return {...p,Tong:Math.round(total*1000)/1000,Gpa:gpa} as Scores;
}
export function rankCandidates<T extends {MaHoSo:number;SoHoSo:string;scores:Scores}>(rows:T[],tie:string,quota:number,floor:number){
 const field=({GPA:'Gpa',NGOAI_NGU:'NgoaiNgu',CO_SO:'CoSo'} as const)[tie as 'GPA']??'Gpa';
 const sorted=[...rows].sort((a,b)=>b.scores.Tong-a.scores.Tong||b.scores[field]-a.scores[field]||a.SoHoSo.localeCompare(b.SoHoSo));
 // A fully tied boundary is held for a documented decision, never silently
 // converted into an arbitrary pass/fail by database insertion order.
 if(sorted.length>quota&&sorted[quota-1].scores.Tong>=floor&&sorted[quota-1].scores.Tong===sorted[quota].scores.Tong&&sorted[quota-1].scores[field]===sorted[quota].scores[field])throw new BadRequestException('Bằng điểm tại ranh giới chỉ tiêu; cần bổ sung tiêu chí hoặc quyết định xử lý trước khi xếp hạng.');
 return sorted.map((row,i)=>({...row,rank:i+1,selected:i<quota&&row.scores.Tong>=floor}));
}
