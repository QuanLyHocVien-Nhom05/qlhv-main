import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SqlServerService } from '../../../shared/infrastructure/sql-server.service';
import { ManagementRepository } from '../application/management.service';
import { lookups, resources } from './resources';
import { storageSearchTerms } from '../../../shared/http/display-label.interceptor';
@Injectable()
export class SqlManagementRepository implements ManagementRepository {
  constructor(private readonly db: SqlServerService) {}
  metadata() {return resources.map(({query,insert,actions,...resource})=>({...resource,canCreate:!!insert,actions:actions?.map(({sql,...action})=>action)??[]}));}
  async list(key: string,page: number,limit: number,search: string,status?:string,actor?:{sub:string;roles:string[]},unit?:number) {
    const resource=resources.find(r=>r.key===key)!;
    const where=resource.columns.map(c=>`(CONVERT(nvarchar(max), [${c}]) LIKE @Pattern ESCAPE N'~' OR CONVERT(nvarchar(max), [${c}]) IN (SELECT value FROM OPENJSON(@Aliases)))`).join(' OR ');
    const lecturer=actor?.roles.includes('LECTURER');
    const owned:Record<string,string>={supervisors:'MaCanBo IN(SELECT MaCanBo FROM nhan_su.CanBo WHERE MaNguoi=@Subject)',classes:'MaLopHocPhan IN(SELECT l.MaLopHocPhan FROM hoc_thuat.LopHocPhan l JOIN nhan_su.CanBo c ON c.MaCanBo=l.MaGiangVien WHERE c.MaNguoi=@Subject)',registrations:'MaDangKy IN(SELECT d.MaDangKy FROM hoc_thuat.DangKyHocPhan d JOIN hoc_thuat.LopHocPhan l ON l.MaLopHocPhan=d.MaLopHocPhan JOIN nhan_su.CanBo c ON c.MaCanBo=l.MaGiangVien WHERE c.MaNguoi=@Subject)',topics:'MaGVHD IN(SELECT MaCanBo FROM nhan_su.CanBo WHERE MaNguoi=@Subject)',defenses:'(MaGVHD IN(SELECT MaCanBo FROM nhan_su.CanBo WHERE MaNguoi=@Subject) OR MaHoiDong IN(SELECT tv.MaHoiDong FROM hoc_thuat.ThanhVienBaoVe tv JOIN nhan_su.CanBo c ON c.MaCanBo=tv.MaCanBo WHERE c.MaNguoi=@Subject))',committee:'MaHoiDong IN(SELECT tv.MaHoiDong FROM hoc_thuat.ThanhVienBaoVe tv JOIN nhan_su.CanBo c ON c.MaCanBo=tv.MaCanBo WHERE c.MaNguoi=@Subject)'};
    const filter=`(@Search=N'' OR ${where})${resource.columns.includes('TrangThai')?' AND (@Status IS NULL OR TrangThai=@Status)':''}${['units','faculties','majors','courses','cohorts'].includes(key)?' AND (@Unit IS NULL OR MaDonVi=@Unit)':''}${lecturer&&owned[key]?' AND '+owned[key]:''}`;
    const values={Search:search,Subject:actor?.sub??null,Unit:unit??null,Status:status??null,Pattern:`%${search.replace(/[~%_\[]/g,'~$&')}%`,Aliases:JSON.stringify(storageSearchTerms(search)),Offset:(page-1)*limit,Limit:limit};
    const result=await this.db.query(`SELECT COUNT(*) AS Total FROM (${resource.query}) t WHERE ${filter}; SELECT * FROM (${resource.query}) t WHERE ${filter} ORDER BY [${resource.id}] DESC OFFSET CAST(@Offset AS int) ROWS FETCH NEXT CAST(@Limit AS int) ROWS ONLY;`,values);
    const sets=result.recordsets as unknown as Record<string,unknown>[][];
    return {data:sets[1],total:sets[0][0].Total,page,limit};
  }
  async options(key: string) {
    if(!lookups[key])throw new NotFoundException('Danh mục không tồn tại.');
    return (await this.db.query(`SELECT TOP (1000) * FROM (${lookups[key]}) t ORDER BY Ten,Id`)).recordset;
  }
  async write(key: string,action: string|null,id: number|null,values: Record<string,unknown>,subject: string) {
    const actor=await this.db.resolveStaff(subject); const resource=resources.find(r=>r.key===key)!;
    const statement=action ? resource.actions!.find(a=>a.key===action)!.sql : resource.insert!;
    if (id && !(await this.db.query(`SELECT 1 AS CoDuLieu FROM (${resource.query}) t WHERE [${resource.id}]=@Id`,{Id:id})).recordset.length) throw new NotFoundException('Bản ghi không tồn tại.');
    await this.db.query(`SET XACT_ABORT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_WARNINGS ON; SET ARITHABORT ON;
      BEGIN TRY BEGIN TRANSACTION;
      IF EXISTS(SELECT 1 FROM he_thong.TaiKhoanDangNhap WHERE MaNguoi=@Nguoi AND VaiTro='GIANG_VIEN') BEGIN
       IF @ResourceName='registrations' AND NOT EXISTS(SELECT 1 FROM hoc_thuat.DangKyHocPhan d JOIN hoc_thuat.LopHocPhan l WITH(UPDLOCK,HOLDLOCK) ON l.MaLopHocPhan=d.MaLopHocPhan WHERE d.MaDangKy=@Id AND l.MaGiangVien=@CanBo) THROW 51203,N'Không được chấm điểm lớp chưa được phân công.',1;
       IF @ResourceName='topics' AND NOT EXISTS(SELECT 1 FROM hoc_thuat.DeTaiHocVien WITH(UPDLOCK,HOLDLOCK) WHERE MaDeTai=@Id AND MaGVHD=@CanBo) THROW 51203,N'Không được cập nhật đề tài chưa được phân công.',1;
      END;
      ${statement};
      INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet)
      VALUES (@GroupName,@ResourceName,COALESCE(@Id,CONVERT(bigint,SCOPE_IDENTITY()),0),@ActionName,@Nguoi,@Detail);
      COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`,
      {...values,CanBo:actor.MaCanBo,Nguoi:actor.MaNguoi,Id:id,GroupName:resource.group,ResourceName:key,ActionName:action??'TAO_MOI',Detail:JSON.stringify(values)});
    return {ok:true};
  }
  async overview(){const result=await this.db.query(`SELECT (SELECT COUNT(*) FROM hoc_thuat.ChuongTrinh) AS ChuongTrinh,(SELECT COUNT(*) FROM hoc_thuat.HocVien) AS HocVien,(SELECT COUNT(*) FROM hoc_thuat.LopHocPhan) AS LopHocPhan,(SELECT COUNT(*) FROM hoc_thuat.PhienBanChuongTrinh WHERE TrangThai='DA_DUYET') AS PhienBanDaDuyet;
SELECT TOP(6) a.MaNhatKy,a.HanhDong,a.TenDoiTuong,n.HoTen,a.ThoiDiem FROM he_thong.NhatKyThayDoi a JOIN danh_muc.Nguoi n ON n.MaNguoi=a.MaNguoiThucHien WHERE a.PhanHe IN('HOC_THUAT','HE_THONG','programs','studies','students','catalogs') ORDER BY a.MaNhatKy DESC;`);const sets=result.recordsets as unknown as Record<string,unknown>[][];return {summary:sets[0][0],activity:sets[1]};}
}
