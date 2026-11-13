'use client';
import { useEffect,useRef,useState,type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '@/lib/api-client';
import {EnrollmentClassesField,ReportColumnsField} from '@/features/admissions/admission-config-fields';
import type { Field,Option } from '@/types/academic';
export function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();},[]);
  return <dialog ref={ref} className="drawer" onCancel={event=>{event.preventDefault();onClose();}}><div className="drawer-heading"><div><p className="eyebrow">QUẢN LÝ HỌC THUẬT</p><h2>{title}</h2></div><button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}><X size={20}/></button></div>{children}</dialog>;
}
export function ReferenceSelect({reference,token,value,onChange,required,id,disabled,disabledValues=[],ariaLabel}:{reference:string;token:string;value:string|number;onChange:(value:string|number)=>void;required?:boolean;id?:string;disabled?:boolean;disabledValues?:number[];ariaLabel?:string}) {
  const query=useQuery({queryKey:['options',reference,token],queryFn:()=>api<Option[]>(`/management/options/${reference}`,token)});
  return <><select id={id} aria-label={ariaLabel} required={required} value={value} disabled={disabled||query.isLoading||!!query.error} onChange={e=>onChange(reference.endsWith('-types')?e.target.value:e.target.value?Number(e.target.value):'')}>
    <option value="">{query.isLoading?'Đang tải danh mục…':query.error?'Không tải được danh mục':'Chọn từ danh mục'}</option>{query.data?.map(option=><option key={option.Id} value={option.Id} disabled={disabledValues.includes(Number(option.Id))}>{option.Ten}</option>)}
  </select>{query.error&&<span className="field-error">{query.error.message} <button type="button" className="text-button" onClick={()=>query.refetch()}>Thử lại</button></span>}{query.data?.length===0&&<span className="field-hint">Chưa có dữ liệu. Hãy thêm tại danh mục tương ứng.</span>}</>;
}
export function DynamicField({field,token,value,onChange,disabled}:{field:Field;token:string;value:unknown;onChange:(value:unknown)=>void;disabled?:boolean}) {
  const id=`field-${field.key}`;
  if(field.key==='LopHocPhan'&&field.type==='text')return <EnrollmentClassesField token={token} value={value} disabled={disabled} onChange={onChange}/>;
  if(field.key==='CauHinhCot')return <ReportColumnsField value={value} disabled={disabled} onChange={onChange}/>;
  if (field.type==='boolean') return <label className="checkbox-label" htmlFor={id}><input id={id} type="checkbox" checked={!!value} disabled={disabled} onChange={e=>onChange(e.target.checked)}/>{field.label}</label>;
  return <div className="form-field"><label htmlFor={id}>{field.label}{field.required&&<span className="required"> *</span>}</label>
    {field.reference?<ReferenceSelect reference={field.reference} token={token} value={(value??'') as string|number} required={field.required} id={id} disabled={disabled} onChange={onChange}/>:field.options?<select id={id} required={field.required} disabled={disabled} value={String(value??'')} onChange={e=>onChange(e.target.value)}><option value="">Chọn {field.label.toLowerCase()}</option>{field.options.map(option=><option key={option} value={option}>{statusLabel(option)}</option>)}</select>:(field.max??0)>500&&field.type==='text'?<textarea id={id} rows={4} maxLength={field.max} required={field.required} disabled={disabled} value={String(value??'')} onChange={e=>onChange(e.target.value)}/>:<input id={id} type={field.type==='number'?'number':field.type==='datetime'?'datetime-local':field.type==='date'?'date':'text'} required={field.required} disabled={disabled} min={field.min} max={field.type==='number'?field.max:undefined} step={field.type==='number'?(field.integer?'1':'0.01'):undefined} maxLength={field.type==='text'?field.max:undefined} value={field.type==='datetime'&&value?new Date(new Date(String(value)).getTime()+7*3600000).toISOString().slice(0,16):String(value??'')} onChange={e=>onChange(field.type==='datetime'&&e.target.value?new Date(e.target.value+'+07:00').toISOString():field.type==='number'&&e.target.value!==''?Number(e.target.value):e.target.value)}/>}
  </div>;
}
const labels:Record<string,string>={applications:'Danh sách hồ sơ',accepted:'Danh sách trúng tuyển',revenue:'Doanh thu lệ phí',TONG_HOP:'Đánh giá tổng hợp',CO_SO:'Bài cơ sở',CHUYEN_NGANH:'Bài chuyên ngành',NHAP:'Bản nháp',DA_DUYET:'Đã duyệt',DANG_HOC:'Đang học',BAO_LUU:'Bảo lưu',THOI_HOC:'Thôi học',TOT_NGHIEP:'Đã kết thúc',HOAN_THANH:'Hoàn thành',HUY:'Đã hủy',THAC_SI:'Thạc sĩ',TIEN_SI:'Tiến sĩ'};
const activityLabels:Record<string,string>={grade:'Chốt điểm',adjust:'Điều chỉnh điểm',status:'Đổi trạng thái'};
export const columnLabels:Record<string,string>={ThanhPhan:'Bài thi',MaLyDo:'Mã lý do',TenLyDo:'Lý do',NoiDungMau:'Hướng dẫn bổ sung',DangSuDung:'Đang sử dụng',TuDong:'Tự động bàn giao',MaGVHD:'Người hướng dẫn',SoVanBan:'Văn bản nguồn',NguonMauUrl:'Nguồn biểu mẫu',Loai:'Loại báo cáo',TieuDe:'Tiêu đề',KyHieu:'Mã',TenDonVi:'Đơn vị',TenNganh:'Ngành',TenHocPhan:'Học phần',HoTen:'Họ tên',HocVi:'Học vị',DangHoatDong:'Hoạt động',MaSoHocVien:'Mã học viên',TenChuongTrinh:'Chương trình',KhoaTuyenSinh:'Khóa',TrangThai:'Trạng thái',HanDaoTao:'Hạn đào tạo',NamHoc:'Năm học',HocKy:'Học kỳ',SiSoToiDa:'Sĩ số tối đa',LopHocPhan:'Lớp',DiemTongKet:'Điểm'};
export function statusLabel(value:string){return labels[value]??activityLabels[value]??value;}
export function display(value:unknown,column='') {
  if(value===null||value===undefined||value==='')return '—';
  if(typeof value==='boolean')return value?'Có':'Chưa';
  if(typeof value==='number')return new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(value);
  const str=String(value);if(column==='ThoiDiem'&&!Number.isNaN(Date.parse(str)))return new Date(str).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});if(/^\d{4}-\d\d-\d\d(T|$)/.test(str))return new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(str));
  return statusLabel(str);
}

Object.assign(labels,{DANG_SU_DUNG:'Đang sử dụng',NGUNG_SU_DUNG:'Ngừng sử dụng',DANG_THUC_HIEN:'Đang thực hiện',DA_NGHIEM_THU:'Đã nghiệm thu',DU_KIEN:'Dự kiến',DAT:'Đạt',KHONG_DAT:'Không đạt',DU_DIEU_KIEN:'Đủ điều kiện',CHUA_DU:'Chưa đủ điều kiện',THIEU_THONG_TIN:'Thiếu thông tin',CONG_BO:'Công bố',AN:'Ẩn',MOI:'Mới đăng ký',DA_LIEN_HE:'Đã liên hệ',CHU_TICH:'Chủ tịch',THU_KY:'Thư ký',PHAN_BIEN:'Phản biện',UY_VIEN:'Ủy viên',KHOA:'Khoa',BO_MON:'Bộ môn',VIEN:'Viện',TRUONG:'Trường',THONG_BAO:'Thông báo',TUYEN_SINH:'Tuyển sinh',HUONG_DAN:'Hướng dẫn',QUY_DINH:'Quy định'});
Object.assign(columnLabels,{TenTiengAnh:'Tên tiếng Anh',SoTinChiMacDinh:'Tín chỉ',SoPhienBan:'Phiên bản',SoTinChi:'Tín chỉ',NgayTao:'Ngày tạo',SoChuongTrinh:'CTĐT liên kết',LoaiDonVi:'Loại đơn vị',TenLop:'Tên lớp',SoHocVien:'Học viên',DangTiepNhan:'Tiếp nhận',TenDeTai:'Tên đề tài',GiangVienHuongDan:'GVHD',BaoCaoTienDo:'Tiến độ',NgayBaoVe:'Ngày bảo vệ',DiaDiem:'Địa điểm',DiemBaoVe:'Điểm bảo vệ',NhanXet:'Nhận xét',MaHoiDong:'Hội đồng',VaiTro:'Vai trò',ChuanNgoaiNgu:'Chuẩn ngoại ngữ',DiemBaoVeDat:'Điểm bảo vệ đạt',SoVanBan:'Số văn bản',ChungChi:'Chứng chỉ',SoHieu:'Số hiệu',NgayHetHan:'Ngày hết hạn',DaXacMinh:'Xác minh',TinChiTichLuy:'Tín chỉ tích lũy',TinChiToiThieu:'Tín chỉ yêu cầu',DiemTrungBinh:'GPA',NgoaiNguDat:'Ngoại ngữ đạt',BaoVeDat:'Bảo vệ đạt',KetQua:'Kết quả',ChiTiet:'Chi tiết',ThoiDiem:'Thời gian',TieuDe:'Tiêu đề',PhanLoai:'Phân loại',NgayBanHanh:'Ban hành',DuongDan:'Liên kết',Email:'Email',NoiDung:'Nội dung',NgayDangKy:'Đăng ký lúc',DiemDatMacDinh:'Điểm đạt tham khảo',NgoaiNguThacSi:'Chuẩn thạc sĩ',NgoaiNguTienSi:'Chuẩn tiến sĩ',HanhDong:'Hành động',TenDoiTuong:'Đối tượng',DiaChiIP:'Địa chỉ IP'});

Object.assign(columnLabels,{TenDonViCha:'Đơn vị cha',SoNganh:'Ngành',SoDonViCon:'Đơn vị con'});
