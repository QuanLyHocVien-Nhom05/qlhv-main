import { ForbiddenException,Injectable } from '@nestjs/common';
import { SqlServerService } from '../../../shared/infrastructure/sql-server.service';
import { storageSearchTerms } from '../../../shared/http/display-label.interceptor';
import type { AccountsRepository } from '../application/accounts.service';
import type { AccountUpdate,CreateAccountInput } from '../domain/account';

const projection=`SELECT t.MaTaiKhoan,t.MaNguoi,t.TenDangNhap,n.HoTen,n.ThuDienTu,n.SoDienThoai,t.VaiTro,t.DangHoatDong,t.DaXoa,t.NgayXoa,
  c.MaCanBo,c.DangHoatDong AS CanBoHoatDong,c.MaDonVi,c.HocVi,CONVERT(nvarchar(18),CONVERT(varbinary(8),t.PhienBanDuLieu),1) AS Revision
  FROM he_thong.TaiKhoanDangNhap t JOIN danh_muc.Nguoi n ON n.MaNguoi=t.MaNguoi LEFT JOIN nhan_su.CanBo c ON c.MaNguoi=t.MaNguoi`;
const transactionStart=`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
  DECLARE @Khoa int; EXEC @Khoa=sys.sp_getapplock @Resource=N'QLHV_QUAN_LY_TAI_KHOAN',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=5000;
  IF @Khoa<0 THROW 51091,N'Dữ liệu tài khoản đang được cập nhật. Vui lòng thử lại.',1;
  IF NOT EXISTS (SELECT 1 FROM he_thong.TaiKhoanDangNhap t WITH (UPDLOCK,HOLDLOCK) JOIN nhan_su.CanBo c WITH (HOLDLOCK) ON c.MaNguoi=t.MaNguoi WHERE t.MaNguoi=@NguoiThucHien AND t.VaiTro='ADMIN' AND t.DangHoatDong=1 AND t.DaXoa=0 AND c.DangHoatDong=1)
    THROW 51203,N'Quyền quản trị đã thay đổi. Vui lòng đăng nhập lại.',1;`;
const transactionEnd=`COMMIT; END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;`;
const ensureStaff=`IF @VaiTro IN('ADMIN','LANH_DAO','CAN_BO','GIANG_VIEN')
  BEGIN
    IF EXISTS (SELECT 1 FROM nhan_su.CanBo WHERE MaNguoi=@NguoiDich AND DangHoatDong=0)
      THROW 51200,N'Hồ sơ cán bộ đang ngừng hoạt động. Cần xử lý hồ sơ cán bộ trước khi cấp quyền.',1;
    IF NOT EXISTS (SELECT 1 FROM nhan_su.CanBo WITH (UPDLOCK,HOLDLOCK) WHERE MaNguoi=@NguoiDich)
    BEGIN
      IF @DonVi IS NULL OR @HocVi IS NULL THROW 51200,N'Quản trị viên cần hồ sơ cán bộ: chọn đơn vị và học vị.',1;
      INSERT nhan_su.CanBo(MaNguoi,MaDonVi,HocVi) VALUES (@NguoiDich,@DonVi,@HocVi);
    END;
  END;`;

@Injectable()
export class SqlAccountsRepository implements AccountsRepository{
  constructor(private readonly db:SqlServerService){}
  private async requireAdmin(actor:string){
    const result=await this.db.query(`SELECT 1 AS Allowed FROM he_thong.TaiKhoanDangNhap t JOIN nhan_su.CanBo c ON c.MaNguoi=t.MaNguoi WHERE t.MaNguoi=@Nguoi AND t.VaiTro='ADMIN' AND t.DangHoatDong=1 AND t.DaXoa=0 AND c.DangHoatDong=1`,{Nguoi:actor});
    if(!result.recordset.length)throw new ForbiddenException('Cần tài khoản quản trị đang hoạt động.');
  }
  async list(actor:string,page:number,limit:number,search:string,state:string){
    await this.requireAdmin(actor);
    const filter=`(@Search=N'' OR TenDangNhap LIKE @Pattern ESCAPE N'~' OR HoTen LIKE @Pattern ESCAPE N'~' OR ThuDienTu LIKE @Pattern ESCAPE N'~' OR HoTen IN (SELECT value FROM OPENJSON(@Aliases)))
      AND (@State='all' OR (@State='active' AND DaXoa=0 AND DangHoatDong=1) OR (@State='locked' AND DaXoa=0 AND DangHoatDong=0) OR (@State='deleted' AND DaXoa=1))`;
    const result=await this.db.query(`SELECT COUNT(*) AS Total FROM (${projection}) a WHERE ${filter}; SELECT * FROM (${projection}) a WHERE ${filter} ORDER BY MaTaiKhoan DESC OFFSET CAST(@Offset AS int) ROWS FETCH NEXT CAST(@Limit AS int) ROWS ONLY`,
      {Search:search,Pattern:`%${search.replace(/[~%_\[]/g,'~$&')}%`,Aliases:JSON.stringify(storageSearchTerms(search)),State:state,Offset:(page-1)*limit,Limit:limit});
    const sets=result.recordsets as unknown as Record<string,unknown>[][];return {data:sets[1],total:sets[0][0].Total,page,limit};
  }
  async options(actor:string){
    await this.requireAdmin(actor);
    const result=await this.db.query(`SELECT TOP(1000) n.MaNguoi,n.HoTen,n.ThuDienTu,c.MaCanBo,c.DangHoatDong AS CanBoHoatDong FROM danh_muc.Nguoi n LEFT JOIN nhan_su.CanBo c ON c.MaNguoi=n.MaNguoi WHERE NOT EXISTS (SELECT 1 FROM he_thong.TaiKhoanDangNhap t WHERE t.MaNguoi=n.MaNguoi) ORDER BY n.HoTen,n.MaNguoi;
      SELECT MaDonVi,TenDonVi FROM danh_muc.DonVi ORDER BY TenDonVi`);
    const sets=result.recordsets as unknown as Record<string,unknown>[][];return {people:sets[0],units:sets[1]};
  }
  async create(actor:string,input:Omit<CreateAccountInput,'MatKhau'|'XacNhanMatKhau'>,hash:string){
    const result=await this.db.query<{MaTaiKhoan:number}>(`${transactionStart}
      DECLARE @NguoiDich bigint=@NguoiCoSan,@TaiKhoanMoi bigint;
      IF @NguoiDich IS NULL
      BEGIN INSERT danh_muc.Nguoi(HoTen,ThuDienTu,SoDienThoai) VALUES (@HoTen,@Email,@DienThoai); SET @NguoiDich=CONVERT(bigint,SCOPE_IDENTITY()); END
      ELSE IF NOT EXISTS (SELECT 1 FROM danh_muc.Nguoi WITH (UPDLOCK,HOLDLOCK) WHERE MaNguoi=@NguoiDich)
        THROW 51204,N'Không tìm thấy hồ sơ người đã chọn.',1;
      ${ensureStaff}
      INSERT he_thong.TaiKhoanDangNhap(MaNguoi,TenDangNhap,MatKhauBam,VaiTro) VALUES (@NguoiDich,@Ten,@Bam,@VaiTro);
      SET @TaiKhoanMoi=CONVERT(bigint,SCOPE_IDENTITY());
      INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet)
        VALUES ('HE_THONG','TaiKhoanDangNhap',@TaiKhoanMoi,'TAO_TAI_KHOAN',@NguoiThucHien,(SELECT @VaiTro AS VaiTro FOR JSON PATH,WITHOUT_ARRAY_WRAPPER));
      ${transactionEnd} SELECT @TaiKhoanMoi AS MaTaiKhoan;`,
      {NguoiThucHien:actor,NguoiCoSan:input.MaNguoi??null,HoTen:input.HoTen??null,Email:input.ThuDienTu??null,DienThoai:input.SoDienThoai||null,Ten:input.TenDangNhap,Bam:hash,VaiTro:input.VaiTro,DonVi:input.MaDonVi??null,HocVi:input.HocVi??null});
    return {message:'Đã tạo tài khoản.',MaTaiKhoan:result.recordset[0].MaTaiKhoan};
  }
  private async change(actor:string,id:number,input:AccountUpdate,remove:boolean){
    await this.db.query(`${transactionStart}
      DECLARE @NguoiDich bigint,@VaiTroCu varchar(20),@HoatDongCu bit;
      SELECT @NguoiDich=MaNguoi,@VaiTroCu=VaiTro,@HoatDongCu=DangHoatDong FROM he_thong.TaiKhoanDangNhap WITH (UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@Id AND DaXoa=0;
      IF @NguoiDich IS NULL THROW 51204,N'Không tìm thấy tài khoản đang quản lý.',1;
      IF NOT EXISTS (SELECT 1 FROM he_thong.TaiKhoanDangNhap WHERE MaTaiKhoan=@Id AND PhienBanDuLieu=CONVERT(binary(8),@Revision,1))
        THROW 51091,N'Tài khoản đã thay đổi. Vui lòng tải lại danh sách.',1;
      IF @NguoiDich=@NguoiThucHien AND (@Xoa=1 OR @HoatDong=0 OR @VaiTro<>'ADMIN')
        THROW 51200,N'Không thể tự xóa, khóa hoặc hạ quyền tài khoản đang đăng nhập.',1;
      IF @VaiTroCu='ADMIN' AND @HoatDongCu=1 AND (@Xoa=1 OR @HoatDong=0 OR @VaiTro<>'ADMIN')
        AND NOT EXISTS (SELECT 1 FROM he_thong.TaiKhoanDangNhap t WITH (HOLDLOCK) JOIN nhan_su.CanBo c WITH (HOLDLOCK) ON c.MaNguoi=t.MaNguoi WHERE t.MaTaiKhoan<>@Id AND t.VaiTro='ADMIN' AND t.DangHoatDong=1 AND t.DaXoa=0 AND c.DangHoatDong=1)
        THROW 51200,N'Phải giữ lại ít nhất một quản trị viên đang hoạt động.',1;
      IF @Xoa=0 BEGIN ${ensureStaff}
       UPDATE danh_muc.Nguoi SET HoTen=COALESCE(@HoTenMoi,HoTen),ThuDienTu=COALESCE(@EmailMoi,ThuDienTu),SoDienThoai=COALESCE(@DienThoaiMoi,SoDienThoai) WHERE MaNguoi=@NguoiDich;
       IF @VaiTro<>'USER' UPDATE nhan_su.CanBo SET MaDonVi=COALESCE(@DonVi,MaDonVi),HocVi=COALESCE(@HocVi,HocVi) WHERE MaNguoi=@NguoiDich;
      END;
      UPDATE he_thong.TaiKhoanDangNhap SET VaiTro=CASE WHEN @Xoa=1 THEN VaiTro ELSE @VaiTro END,
        DangHoatDong=CASE WHEN @Xoa=1 THEN 0 ELSE @HoatDong END,DaXoa=@Xoa,NgayXoa=CASE WHEN @Xoa=1 THEN SYSUTCDATETIME() ELSE NULL END,
        PhienBanMatKhau=PhienBanMatKhau+1 WHERE MaTaiKhoan=@Id;
      INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet)
        VALUES ('HE_THONG','TaiKhoanDangNhap',@Id,CASE WHEN @Xoa=1 THEN 'XOA_TAI_KHOAN' ELSE 'CAP_NHAT_QUYEN_TAI_KHOAN' END,@NguoiThucHien,
          (SELECT @VaiTroCu AS VaiTroCu,CASE WHEN @Xoa=1 THEN @VaiTroCu ELSE @VaiTro END AS VaiTroMoi,@HoatDongCu AS HoatDongCu,@HoatDong AS HoatDongMoi FOR JSON PATH,WITHOUT_ARRAY_WRAPPER));
      ${transactionEnd}`,{NguoiThucHien:actor,Id:id,Revision:input.Revision,VaiTro:input.VaiTro,HoatDong:input.DangHoatDong,Xoa:remove,DonVi:input.MaDonVi??null,HocVi:input.HocVi??null,HoTenMoi:input.HoTen??null,EmailMoi:input.ThuDienTu??null,DienThoaiMoi:input.SoDienThoai??null});
    return {message:remove?'Đã xóa quyền truy cập của tài khoản. Hồ sơ và lịch sử được giữ lại.':'Đã cập nhật quyền và trạng thái. Các phiên đăng nhập cũ đã hết hiệu lực.'};
  }
  update(actor:string,id:number,input:AccountUpdate){return this.change(actor,id,input,false);}
  remove(actor:string,id:number,revision:string){return this.change(actor,id,{Revision:revision,VaiTro:'USER',DangHoatDong:false},true);}
}
