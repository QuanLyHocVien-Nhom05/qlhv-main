export interface CurriculumCourseInput {MaHocPhan:number;SoTinChi:number;HocKyDuKien:number;BatBuoc:boolean;TienQuyet:number[];}
export interface CurriculumInput {
  KhoaTuyenSinh:string;TinChiToiThieu:number;DiemDatHocPhan:number;DiemTrungBinhToiThieu:number;
  ThoiGianToiDaThang:number;HocPhan:CurriculumCourseInput[];
}
export interface TrainingProgramInput {KyHieu:string;TenChuongTrinh:string;MaNganh:number;TrinhDo:string;PhienBan:CurriculumInput;}
export interface TrainingProgramUpdate {MaPhienBan:number;Revision:string;PhienBan:CurriculumInput;}
