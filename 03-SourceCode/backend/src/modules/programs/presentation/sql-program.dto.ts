import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsString, Matches, Max, MaxLength, Min, ValidateNested, IsDefined } from 'class-validator';
export class SqlCourseDto {
  @IsInt() @Min(1) MaHocPhan!: number;
  @IsInt() @Min(1) @Max(30) SoTinChi!: number;
  @IsInt() @Min(1) @Max(20) HocKyDuKien!: number;
  @IsBoolean() BatBuoc!: boolean;
  @IsArray() @ArrayMaxSize(100) @IsInt({each:true}) @Min(1,{each:true}) TienQuyet!: number[];
}
export class SqlVersionDto {
  @IsString() @Matches(/\S/) @MaxLength(30) KhoaTuyenSinh!: string;
  @IsInt() @Min(1) @Max(500) TinChiToiThieu!: number;
  @IsNumber() @Min(0) @Max(10) DiemDatHocPhan!: number;
  @IsNumber() @Min(0) @Max(10) DiemTrungBinhToiThieu!: number;
  @IsInt() @Min(1) @Max(240) ThoiGianToiDaThang!: number;
  @IsArray() @ArrayMaxSize(300) @ValidateNested({each:true}) @Type(()=>SqlCourseDto) HocPhan!: SqlCourseDto[];
}
export class CreateSqlProgramDto {
  @Matches(/^[A-Z0-9_-]{1,30}$/) KyHieu!: string;
  @IsString() @Matches(/\S/) @MaxLength(250) TenChuongTrinh!: string;
  @IsInt() @Min(1) MaNganh!: number;
  @IsIn(['THAC_SI','TIEN_SI']) TrinhDo!: string;
  @IsDefined() @ValidateNested() @Type(()=>SqlVersionDto) PhienBan!: SqlVersionDto;
}
export class RevisionSqlDto {@Matches(/^0x[0-9a-fA-F]{16}$/) Revision!: string;}
export class UpdateSqlProgramDto extends RevisionSqlDto {
  @IsInt() @Min(1) MaPhienBan!: number;
  @IsDefined() @ValidateNested() @Type(()=>SqlVersionDto) PhienBan!: SqlVersionDto;
}
export class CloneSqlVersionDto {
  @IsInt() @Min(1) MaPhienBanGoc!: number;
  @IsString() @Matches(/\S/) @MaxLength(30) KhoaTuyenSinh!: string;
}
