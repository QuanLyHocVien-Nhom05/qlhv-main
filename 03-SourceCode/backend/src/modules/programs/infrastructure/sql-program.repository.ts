import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SqlServerService } from '../../../shared/infrastructure/sql-server.service';
import { SqlProgramRepository } from '../application/sql-program.service';
import type { TrainingProgramInput as CreateSqlProgramDto, CurriculumInput as SqlVersionDto, TrainingProgramUpdate as UpdateSqlProgramDto } from '../domain/training-program';
const insertCurriculum=`
  INSERT hoc_thuat.KhungHocPhan(MaPhienBan,MaHocPhan,TenHocPhan,SoTinChi,HocKyDuKien,BatBuoc)
  SELECT @PhienBanId,c.MaHocPhan,h.TenHocPhan,c.SoTinChi,c.HocKyDuKien,c.BatBuoc
  FROM OPENJSON(@HocPhan) WITH (MaHocPhan int,SoTinChi int,HocKyDuKien int,BatBuoc bit) c JOIN hoc_thuat.HocPhan h ON h.MaHocPhan=c.MaHocPhan;
  IF (SELECT COUNT(*) FROM hoc_thuat.KhungHocPhan WHERE MaPhienBan=@PhienBanId)<>(SELECT COUNT(*) FROM OPENJSON(@HocPhan)) THROW 51090,N'Có học phần không tồn tại trong danh mục.',1;
  INSERT hoc_thuat.HocPhanTienQuyet(MaPhienBan,MaHocPhan,MaHocPhanTienQuyet)
  SELECT @PhienBanId,c.MaHocPhan,CONVERT(int,t.value) FROM OPENJSON(@HocPhan) WITH (MaHocPhan int,TienQuyet nvarchar(max) AS JSON) c CROSS APPLY OPENJSON(c.TienQuyet) t;
`;
const wrap=(statement:string)=>`SET XACT_ABORT ON; SET QUOTED_IDENTIFIER ON; SET ARITHABORT ON;
  BEGIN TRY BEGIN TRANSACTION; ${statement};
  INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien) VALUES ('HOC_THUAT','ChuongTrinh',@Id,@HanhDong,@Nguoi);
  COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`;
const values=(v:SqlVersionDto)=>({...v,HocPhan:JSON.stringify(v.HocPhan)});
@Injectable()
export class SqlProgramsRepository implements SqlProgramRepository {
  constructor(private readonly db: SqlServerService) {}
  async list(search: string) {
    return (await this.db.query(`SELECT TOP (200) c.MaChuongTrinh,c.KyHieu,c.TenChuongTrinh,n.TenNganh,c.TrinhDo,
      (SELECT COUNT(*) FROM hoc_thuat.PhienBanChuongTrinh p WHERE p.MaChuongTrinh=c.MaChuongTrinh) AS SoPhienBan,
      (SELECT COUNT(*) FROM hoc_thuat.PhienBanChuongTrinh p WHERE p.MaChuongTrinh=c.MaChuongTrinh AND p.TrangThai='DA_DUYET') AS SoDaDuyet
      FROM hoc_thuat.ChuongTrinh c JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh
      WHERE @Search=N'' OR c.TenChuongTrinh LIKE @Pattern OR c.KyHieu LIKE @Pattern ORDER BY c.MaChuongTrinh DESC`,{Search:search,Pattern:`%${search}%`})).recordset;
  }
  async get(id: number) {
    const result=await this.db.query(`SELECT c.*,n.TenNganh FROM hoc_thuat.ChuongTrinh c JOIN danh_muc.Nganh n ON n.MaNganh=c.MaNganh WHERE MaChuongTrinh=@Id;
      SELECT p.MaPhienBan,p.MaChuongTrinh,p.SoPhienBan,p.KhoaTuyenSinh,p.TinChiToiThieu,p.DiemDatHocPhan,p.DiemTrungBinhToiThieu,p.ThoiGianToiDaThang,p.TrangThai,p.MaCanBoPheDuyet,p.NgayPheDuyet,
        CONVERT(nvarchar(18),CONVERT(varbinary(8),p.PhienBanDuLieu),1) AS Revision FROM hoc_thuat.PhienBanChuongTrinh p WHERE MaChuongTrinh=@Id ORDER BY SoPhienBan;
      SELECT k.*,h.KyHieu FROM hoc_thuat.KhungHocPhan k JOIN hoc_thuat.HocPhan h ON h.MaHocPhan=k.MaHocPhan JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=k.MaPhienBan WHERE p.MaChuongTrinh=@Id ORDER BY k.HocKyDuKien,k.MaHocPhan;
      SELECT t.* FROM hoc_thuat.HocPhanTienQuyet t JOIN hoc_thuat.PhienBanChuongTrinh p ON p.MaPhienBan=t.MaPhienBan WHERE p.MaChuongTrinh=@Id;`,{Id:id});
    const sets=result.recordsets as unknown as any[][];
    if (!sets[0][0]) throw new NotFoundException('Chương trình không tồn tại.');
    return {...sets[0][0],PhienBan:sets[1].map(({PhienBanDuLieu,...v})=>({...v,HocPhan:sets[2].filter(c=>c.MaPhienBan===v.MaPhienBan).map(c=>({...c,TienQuyet:sets[3].filter(t=>t.MaPhienBan===v.MaPhienBan&&t.MaHocPhan===c.MaHocPhan).map(t=>t.MaHocPhanTienQuyet)}))}))};
  }
  async create(input:CreateSqlProgramDto,subject:string) {
    const actor=await this.db.resolveStaff(subject);
    const result=await this.db.query(wrap(`INSERT hoc_thuat.ChuongTrinh(KyHieu,TenChuongTrinh,MaNganh,TrinhDo) VALUES (@KyHieu,@TenChuongTrinh,@MaNganh,@TrinhDo);
      SET @Id=CONVERT(int,SCOPE_IDENTITY());
      INSERT hoc_thuat.PhienBanChuongTrinh(MaChuongTrinh,SoPhienBan,KhoaTuyenSinh,TinChiToiThieu,DiemDatHocPhan,DiemTrungBinhToiThieu,ThoiGianToiDaThang)
      VALUES (@Id,1,@KhoaTuyenSinh,@TinChiToiThieu,@DiemDatHocPhan,@DiemTrungBinhToiThieu,@ThoiGianToiDaThang);
      DECLARE @PhienBanId int=CONVERT(int,SCOPE_IDENTITY()); ${insertCurriculum} SELECT @Id AS MaChuongTrinh`),
      {...values(input.PhienBan),KyHieu:input.KyHieu,TenChuongTrinh:input.TenChuongTrinh,MaNganh:input.MaNganh,TrinhDo:input.TrinhDo,Id:0,Nguoi:actor.MaNguoi,HanhDong:'TAO_CHUONG_TRINH'});
    return this.get(result.recordset[0].MaChuongTrinh as number);
  }
  async initialize(id:number,input:SqlVersionDto,subject:string){
    const actor=await this.db.resolveStaff(subject);
    await this.db.query(wrap(`IF NOT EXISTS(SELECT 1 FROM hoc_thuat.ChuongTrinh WITH(UPDLOCK,HOLDLOCK) WHERE MaChuongTrinh=@Id) THROW 51090,N'Chương trình không tồn tại.',1;
      IF EXISTS(SELECT 1 FROM hoc_thuat.PhienBanChuongTrinh WHERE MaChuongTrinh=@Id) THROW 51091,N'Chương trình đã có phiên bản; hãy sao chép phiên bản hiện có.',1;
      INSERT hoc_thuat.PhienBanChuongTrinh(MaChuongTrinh,SoPhienBan,KhoaTuyenSinh,TinChiToiThieu,DiemDatHocPhan,DiemTrungBinhToiThieu,ThoiGianToiDaThang)
      VALUES(@Id,1,@KhoaTuyenSinh,@TinChiToiThieu,@DiemDatHocPhan,@DiemTrungBinhToiThieu,@ThoiGianToiDaThang);
      DECLARE @PhienBanId int=CONVERT(int,SCOPE_IDENTITY());${insertCurriculum}`),{...values(input),Id:id,Nguoi:actor.MaNguoi,HanhDong:'TAO_PHIEN_BAN_DAU_TIEN'});
    return this.get(id);
  }
  async update(id:number,input:UpdateSqlProgramDto,subject:string) {
    const actor=await this.db.resolveStaff(subject);
    await this.db.query(wrap(`IF NOT EXISTS (SELECT 1 FROM hoc_thuat.PhienBanChuongTrinh WITH (UPDLOCK,HOLDLOCK) WHERE MaPhienBan=@PhienBanId AND MaChuongTrinh=@Id AND TrangThai='NHAP' AND PhienBanDuLieu=CONVERT(binary(8),@Revision,1)) THROW 51091,N'Phiên bản đã khóa hoặc dữ liệu đã thay đổi. Hãy tải lại.',1;
      DELETE hoc_thuat.HocPhanTienQuyet WHERE MaPhienBan=@PhienBanId; DELETE hoc_thuat.KhungHocPhan WHERE MaPhienBan=@PhienBanId;
      UPDATE hoc_thuat.PhienBanChuongTrinh SET KhoaTuyenSinh=@KhoaTuyenSinh,TinChiToiThieu=@TinChiToiThieu,DiemDatHocPhan=@DiemDatHocPhan,DiemTrungBinhToiThieu=@DiemTrungBinhToiThieu,ThoiGianToiDaThang=@ThoiGianToiDaThang WHERE MaPhienBan=@PhienBanId;
      ${insertCurriculum}`),{...values(input.PhienBan),Id:id,PhienBanId:input.MaPhienBan,Revision:input.Revision,Nguoi:actor.MaNguoi,HanhDong:'CAP_NHAT_KHUNG'});
    return this.get(id);
  }
  async clone(id:number,source:number,cohort:string,subject:string) {
    const actor=await this.db.resolveStaff(subject);
    await this.db.query(wrap(`IF NOT EXISTS (SELECT 1 FROM hoc_thuat.PhienBanChuongTrinh WHERE MaPhienBan=@Source AND MaChuongTrinh=@Id) THROW 51090,N'Phiên bản không thuộc chương trình.',1;
      DECLARE @PhienBanMoi int; EXEC hoc_thuat.usp_SaoChepPhienBan @Source,@Cohort,@Nguoi,@PhienBanMoi OUTPUT`),{Id:id,Source:source,Cohort:cohort,Nguoi:actor.MaNguoi,HanhDong:'SAO_CHEP_PHIEN_BAN'});
    return this.get(id);
  }
  async approve(id:number,version:number,revision:string,subject:string) {
    const actor=await this.db.resolveStaff(subject);
    await this.db.query(wrap(`IF NOT EXISTS (SELECT 1 FROM hoc_thuat.PhienBanChuongTrinh WITH (UPDLOCK,HOLDLOCK) WHERE MaPhienBan=@Version AND MaChuongTrinh=@Id AND PhienBanDuLieu=CONVERT(binary(8),@Revision,1)) THROW 51091,N'Dữ liệu đã thay đổi. Hãy tải lại trước khi duyệt.',1;
      EXEC hoc_thuat.usp_PheDuyetPhienBan @Version,@CanBo`),{Id:id,Version:version,Revision:revision,CanBo:actor.MaCanBo,Nguoi:actor.MaNguoi,HanhDong:'PHE_DUYET_PHIEN_BAN'});
    return this.get(id);
  }
}
