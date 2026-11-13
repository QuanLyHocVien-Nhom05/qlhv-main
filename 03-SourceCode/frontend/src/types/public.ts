export type PublicProgram={MaChuongTrinh:number;KyHieu:string;TenChuongTrinh:string;TrinhDo:string;TenNganh:string;TenDonVi:string;KhoaTuyenSinh:string|null;TinChiToiThieu:number|null;ThoiGianToiDaThang:number|null;ThoiGianChuanThang?:number|null;SoPhienBan:number|null;NguonUrl?:string|null;BanSaoUrl?:string|null;MoTaNguon?:string|null};
export type PublicProgramsPage={data:PublicProgram[];total:number;page:number;limit:number};
export type PublicCourse={KyHieu:string;TenHocPhan:string;SoTinChi:number;HocKyDuKien:number;BatBuoc:boolean};
