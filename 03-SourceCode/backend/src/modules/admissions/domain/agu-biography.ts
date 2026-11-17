import {BadRequestException} from '@nestjs/common';

export const aguBiographySource={
 id:'AGU_2026',title:'Sơ yếu lý lịch trong bộ hồ sơ dự tuyển thạc sĩ AGU 2026',checkedOn:'2026-11-17',
 pageUrl:'https://tuyensinh.agu.edu.vn/tin-tuc/thong-bao-ve-viec-tuyen-sinh-dao-tao-trinh-do-thac-si-dot-2-nam-2026',
 sourceUrl:'https://tuyensinh.agu.edu.vn/uploads/cef1d278b0893dbc628f16e971848e37.doc',
 localFile:'/tai-lieu/ho-so-du-tuyen-thac-si-agu-2026.doc',sha256:'ea23be5f0257dc38ba7f48ac1dd21e4cc585cfd0861a6ba29d7ecfe5ed1027fd',
};
export const biographyLabels:Record<string,string>={GioiTinh:'Giới tính',NoiSinh:'Nơi sinh',QueQuan:'Quê quán',DanToc:'Dân tộc',TonGiao:'Tôn giáo',HoKhauThuongTru:'Hộ khẩu thường trú',DiaChiLienHe:'Địa chỉ liên lạc',TrinhDoVanHoa:'Trình độ văn hóa',TrinhDoNgoaiNgu:'Trình độ ngoại ngữ',TrinhDoTinHoc:'Trình độ tin học',HinhThucDaoTao:'Hình thức đào tạo đại học',NamTotNghiep:'Năm tốt nghiệp đại học',NgheNghiep:'Nghề nghiệp hiện nay',ChucVu:'Chức vụ',DiaChiCoQuan:'Địa chỉ cơ quan',NgayBatDauCongTac:'Ngày bắt đầu công tác trong ngành dự tuyển',SoNamCongTac:'Số năm công tác trong chuyên ngành',NgayVaoDoan:'Ngày vào Đoàn',NoiVaoDoan:'Nơi vào Đoàn',NgayVaoDang:'Ngày vào Đảng',NoiVaoDang:'Nơi vào Đảng',KhenThuong:'Khen thưởng',KyLuat:'Kỷ luật',GhiChuGiaDinh:'Ghi chú gia đình'};
const textKeys=['GioiTinh','NoiSinh','QueQuan','DanToc','TonGiao','HoKhauThuongTru','DiaChiLienHe','TrinhDoVanHoa','TrinhDoNgoaiNgu','TrinhDoTinHoc','HinhThucDaoTao','NgheNghiep','ChucVu','DiaChiCoQuan','NgayBatDauCongTac','NgayVaoDoan','NoiVaoDoan','NgayVaoDang','NoiVaoDang','KhenThuong','KyLuat','GhiChuGiaDinh'] as const;
export type BiographyActivity={TuThang:string;DenThang:string;CongViec:string;DonViCongTac:string;ChucVu:string};
export type BiographyRelative={QuanHe:'CHA'|'ME'|'ANH_CHI_EM'|'VO_CHONG'|'CON';HoTen:string;NamSinh:number|null;Tuoi:number|null;NgheNghiep:string;NoiLamViec:string;NoiOHienNay:string};
export type AguBiography=Record<typeof textKeys[number],string>&{PhienBan:'AGU_2026';NamTotNghiep:number|null;SoNamCongTac:number|null;QuaTrinhHoatDong:BiographyActivity[];GiaDinh:BiographyRelative[];GiaDinhDaKhaiBao:boolean;CamDoan:boolean};
export const relativeLabels:Record<string,string>={CHA:'Bố',ME:'Mẹ',ANH_CHI_EM:'Anh/chị/em ruột',VO_CHONG:'Vợ/chồng',CON:'Con'};
export const admissionToday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const object=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw new BadRequestException('Sơ yếu lý lịch: dữ liệu không hợp lệ.');return v as Record<string,unknown>;};
function known(o:Record<string,unknown>,keys:string[]){if(Object.keys(o).some(k=>!keys.includes(k)))throw new BadRequestException('Sơ yếu lý lịch có trường không được phép.');}
function text(v:unknown,label:string,max=500){if(v===undefined)return '';if(typeof v!=='string'||v.trim().length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v))throw new BadRequestException('Sơ yếu lý lịch: '+label+' không hợp lệ.');return v.trim();}
function number(v:unknown,label:string,min:number,max:number){if(v===undefined||v===null||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||!Number.isInteger(v)||v<min||v>max)throw new BadRequestException('Sơ yếu lý lịch: '+label+' không hợp lệ.');return v;}
function boolean(v:unknown,label:string){if(v===undefined)return false;if(typeof v!=='boolean')throw new BadRequestException('Sơ yếu lý lịch: '+label+' phải là lựa chọn xác nhận.');return v;}
function date(v:string,label:string,birth:string){if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||v>admissionToday()||v<birth))throw new BadRequestException('Sơ yếu lý lịch: '+label+' phải là ngày hợp lệ, từ ngày sinh đến hiện tại.');}
function month(v:string,label:string,birth:string){if(v&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)||v>admissionToday().slice(0,7)||v<birth.slice(0,7)))throw new BadRequestException('Sơ yếu lý lịch: '+label+' không hợp lệ.');}

export function validateAguBiography(input:unknown,birth:string):AguBiography{
 const o=object(input),year=Number(admissionToday().slice(0,4));
 known(o,['PhienBan',...textKeys,'NamTotNghiep','SoNamCongTac','QuaTrinhHoatDong','GiaDinh','GiaDinhDaKhaiBao','CamDoan']);
 if(o.PhienBan!=='AGU_2026')throw new BadRequestException('Phiên bản sơ yếu lý lịch chưa được hỗ trợ.');
 const b={PhienBan:'AGU_2026'} as AguBiography;
 for(const k of textKeys)b[k]=text(o[k],biographyLabels[k]);
 if(!['','NAM','NU','KHAC'].includes(b.GioiTinh))throw new BadRequestException('Giới tính không hợp lệ.');
 b.NamTotNghiep=number(o.NamTotNghiep,'Năm tốt nghiệp',Math.max(1900,Number(birth.slice(0,4))),year);
 b.SoNamCongTac=number(o.SoNamCongTac,'Số năm công tác',0,Math.min(100,year-Number(birth.slice(0,4))));
 for(const k of ['NgayBatDauCongTac','NgayVaoDoan','NgayVaoDang'] as const)date(b[k],biographyLabels[k],birth);
 b.GiaDinhDaKhaiBao=boolean(o.GiaDinhDaKhaiBao,'Kê khai gia đình');b.CamDoan=boolean(o.CamDoan,'Cam đoan');
 const activities=o.QuaTrinhHoatDong??[],relatives=o.GiaDinh??[];
 if(!Array.isArray(activities)||activities.length>20||!Array.isArray(relatives)||relatives.length>20)throw new BadRequestException('Sơ yếu lý lịch: tối đa 20 dòng cho mỗi bảng quá trình hoạt động/gia đình.');
 b.QuaTrinhHoatDong=activities.map(value=>{const r=object(value);known(r,['TuThang','DenThang','CongViec','DonViCongTac','ChucVu']);const row=Object.fromEntries(['TuThang','DenThang','CongViec','DonViCongTac','ChucVu'].map(k=>[k,text(r[k],k,300)])) as BiographyActivity;
  month(row.TuThang,'Từ tháng',birth);month(row.DenThang,'Đến tháng',birth);if(row.TuThang&&row.DenThang&&row.TuThang>row.DenThang)throw new BadRequestException('Quá trình hoạt động: thời gian kết thúc phải từ thời gian bắt đầu trở đi.');return row;});
 const unique=new Set<string>();
 b.GiaDinh=relatives.map(value=>{const r=object(value);known(r,['QuanHe','HoTen','NamSinh','Tuoi','NgheNghiep','NoiLamViec','NoiOHienNay']);const relation=String(r.QuanHe);if(!relativeLabels[relation])throw new BadRequestException('Quan hệ gia đình không hợp lệ.');
  if(['CHA','ME','VO_CHONG'].includes(relation)){if(unique.has(relation))throw new BadRequestException('Không khai trùng bố, mẹ hoặc vợ/chồng.');unique.add(relation);}
  return {QuanHe:relation,HoTen:text(r.HoTen,'Họ tên người thân',150),NamSinh:number(r.NamSinh,'Năm sinh người thân',1850,year),Tuoi:number(r.Tuoi,'Tuổi người thân',0,130),NgheNghiep:text(r.NgheNghiep,'Nghề nghiệp người thân',300),NoiLamViec:text(r.NoiLamViec,'Nơi làm việc người thân',300),NoiOHienNay:text(r.NoiOHienNay,'Nơi ở người thân',500)} as BiographyRelative;});
 if(Buffer.byteLength(JSON.stringify(b),'utf8')>64000)throw new BadRequestException('Nội dung sơ yếu lý lịch vượt 64 KB.');
 return b;
}

export function requireAguBiography(profile:{NgaySinh:string;SoYeuLyLich?:AguBiography}):AguBiography{
 if(!profile?.SoYeuLyLich)throw new BadRequestException('Hoàn thiện sơ yếu lý lịch theo mẫu AGU trước khi nộp hồ sơ.');
 const b=validateAguBiography(profile.SoYeuLyLich,profile.NgaySinh);
 const required=['GioiTinh','NoiSinh','QueQuan','DanToc','TonGiao','HoKhauThuongTru','DiaChiLienHe','TrinhDoVanHoa','TrinhDoNgoaiNgu','TrinhDoTinHoc','HinhThucDaoTao','NgheNghiep'] as const;
 const missing=required.filter(k=>!b[k]).map(k=>biographyLabels[k]);if(b.NamTotNghiep===null)missing.push('Năm tốt nghiệp đại học');
 if(missing.length)throw new BadRequestException('Sơ yếu lý lịch còn thiếu: '+missing.join(', '));
 if(!b.QuaTrinhHoatDong.length||b.QuaTrinhHoatDong.some(r=>!r.TuThang||!r.CongViec||!r.DonViCongTac))throw new BadRequestException('Kê khai ít nhất một dòng quá trình hoạt động/học tập với thời gian bắt đầu, công việc và đơn vị.');
 if(b.GiaDinh.some(r=>!r.HoTen)||!b.GiaDinhDaKhaiBao)throw new BadRequestException('Hoàn thiện tên người thân và xác nhận đã kê khai gia đình; nếu không có thông tin, bỏ dòng trống và ghi chú khi cần.');
 if(!b.CamDoan)throw new BadRequestException('Cần xác nhận cam đoan thông tin sơ yếu lý lịch trước khi nộp.');
 return b;
}
