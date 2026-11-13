import { Transform } from 'class-transformer';
import { IsBoolean,IsEmail,IsIn,IsInt,IsOptional,IsString,Matches,Max,MaxLength,Min,MinLength,ValidateIf } from 'class-validator';
import { PageDto } from '../../management/presentation/management.controller';
import type { AccountRole } from '../domain/account';
const trim=({value}:{value:unknown})=>typeof value==='string'?value.trim():value;
export class AccountsPageDto extends PageDto{@IsIn(['active','locked','deleted','all']) state='active';}
export class CreateAccountDto{
  @Transform(({value})=>typeof value==='string'?value.trim().toLowerCase():value) @Matches(/^[a-z0-9][a-z0-9._-]{2,49}$/) TenDangNhap!:string;
  @IsOptional() @IsInt() @Min(1) @Max(999999999999) MaNguoi?:number;
  @ValidateIf(value=>!value.MaNguoi) @Transform(trim) @IsString() @MinLength(2) @MaxLength(150) HoTen?:string;
  @ValidateIf(value=>!value.MaNguoi) @Transform(({value})=>typeof value==='string'?value.trim().toLowerCase():value) @IsEmail() @MaxLength(254) ThuDienTu?:string;
  @IsOptional() @Transform(trim) @Matches(/^\+?[0-9][0-9 ()-]{6,18}[0-9]$/) SoDienThoai?:string;
  @IsIn(['ADMIN','LANH_DAO','CAN_BO','GIANG_VIEN','USER','THI_SINH']) VaiTro!:AccountRole;
  @IsString() @MinLength(8) @MaxLength(128) MatKhau!:string;
  @IsString() @MinLength(8) @MaxLength(128) XacNhanMatKhau!:string;
  @IsOptional() @IsInt() @Min(1) @Max(2147483647) MaDonVi?:number;
  @IsOptional() @IsIn(['THAC_SI','TIEN_SI']) HocVi?:'THAC_SI'|'TIEN_SI';
}
export class UpdateAccountDto{
  @IsOptional() @Transform(trim) @IsString() @MinLength(2) @MaxLength(150) HoTen?:string;
  @IsOptional() @Transform(({value})=>typeof value==='string'?value.trim().toLowerCase():value) @IsEmail() @MaxLength(254) ThuDienTu?:string;
  @IsOptional() @Transform(trim) @Matches(/^\+?[0-9][0-9 ()-]{6,18}[0-9]$/) SoDienThoai?:string;
  @IsIn(['ADMIN','LANH_DAO','CAN_BO','GIANG_VIEN','USER','THI_SINH']) VaiTro!:AccountRole;
  @IsBoolean() DangHoatDong!:boolean;
  @Matches(/^0x[0-9a-fA-F]{16}$/) Revision!:string;
  @IsOptional() @IsInt() @Min(1) @Max(2147483647) MaDonVi?:number;
  @IsOptional() @IsIn(['THAC_SI','TIEN_SI']) HocVi?:'THAC_SI'|'TIEN_SI';
}
export class DeleteAccountDto{@Matches(/^0x[0-9a-fA-F]{16}$/) Revision!:string;}
