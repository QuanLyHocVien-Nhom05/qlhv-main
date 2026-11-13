import type { AccountRole } from '../../../shared/security/roles';
export type { AccountRole } from '../../../shared/security/roles';
export type StaffInput={MaDonVi?:number;HocVi?:'THAC_SI'|'TIEN_SI'};
export type CreateAccountInput=StaffInput & {TenDangNhap:string;MaNguoi?:number;HoTen?:string;ThuDienTu?:string;SoDienThoai?:string;VaiTro:AccountRole;MatKhau:string;XacNhanMatKhau:string};
export type AccountUpdate=StaffInput & {VaiTro:AccountRole;DangHoatDong:boolean;Revision:string;HoTen?:string;ThuDienTu?:string;SoDienThoai?:string};
export function passwordProblem(password:string,confirmation:string):string|null{
  if(password!==confirmation)return 'Xác nhận mật khẩu không khớp.';
  if(password.trim().length<8||password.length>128)return 'Mật khẩu cần từ 8 đến 128 ký tự, không chỉ gồm khoảng trắng.';
  return null;
}
