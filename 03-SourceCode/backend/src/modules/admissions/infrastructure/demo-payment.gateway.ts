import {BadRequestException,NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {randomUUID} from 'node:crypto';
import QRCode from 'qrcode';
import type {AdmissionsService,AdmissionActor} from '../application/admissions.service';
import {demoPaymentsEnabled} from '../domain/payment-mode';
export {demoPaymentsEnabled} from '../domain/payment-mode';

export type DemoOutcome='THANH_CONG'|'THAT_BAI'|'HET_HAN';
const selectPayment='SELECT MaGiaoDich,MaHoSo,LoaiPhi,SoTien,Kenh,TrangThai,LaMoPhong,HanThanhToan,KetQuaMoPhong,MaBienLai,NgayThanhToan FROM tuyen_sinh.GiaoDich';
const audit=(event:string,codes:string)=>`INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,DiaChiIP,ChiTiet)
 SELECT 'TUYEN_SINH','GiaoDich',p.MaHoSo,'${event}',@Actor,@IP,
 (SELECT p.MaGiaoDich,p.SoTien,p.KetQuaMoPhong,CAST(1 AS bit) AS MoPhong FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)
 FROM tuyen_sinh.GiaoDich p WHERE p.MaGiaoDich IN(${codes});`;

export class DemoPaymentGateway{
 constructor(private readonly service:AdmissionsService,private readonly config:ConfigService){}
 assertEnabled(){if(!demoPaymentsEnabled(this.config))throw new NotFoundException('Thanh toán mô phỏng chưa bật hoặc không được dùng trong môi trường này.');}
 private async owner(id:number,actor:AdmissionActor){
  this.assertEnabled();const h=await this.service.get(id,actor);
  if(String(h.MaNguoi)!==actor.sub||!actor.roles.some(r=>['APPLICANT','STUDENT'].includes(r)))throw new NotFoundException('Không tìm thấy giao dịch của bạn.');
  return h;
 }
 private async present(row:any){
  if(!row)throw new NotFoundException('Không tìm thấy giao dịch mô phỏng.');
  const expires=new Date(row.HanThanhToan).toISOString();
  const payload=JSON.stringify({type:'ADMISSION_DEMO_ONLY',transaction:row.MaGiaoDich,amountVnd:Number(row.SoTien),expires,notice:'MO PHONG - KHONG CHUYEN TIEN THAT'});
  return {...row,LaMoPhong:true,HanThanhToan:expires,qrDataUrl:await QRCode.toDataURL(payload,{width:280,margin:4,errorCorrectionLevel:'M'}),
   message:row.TrangThai==='DA_TT'?'Đã mô phỏng thanh toán thành công. Biên lai không có giá trị thu tiền.':row.KetQuaMoPhong==='HET_HAN'?'Giao dịch mô phỏng đã hết hạn.':row.TrangThai==='THAT_BAI'?'Giao dịch mô phỏng thất bại.':'QR mô phỏng cho đồ án — không chuyển tiền thật.'};
 }
 async create(id:number,type:string,actor:AdmissionActor){
  const h=await this.owner(id,actor);
  if(!['XET_TUYEN','NHAP_HOC'].includes(type))throw new BadRequestException('Loại phí không hợp lệ.');
  const amount=Number(type==='XET_TUYEN'?h.LePhi:h.PhiNhapHoc);
  if(!Number.isSafeInteger(amount)||amount<=0)throw new BadRequestException('QR mô phỏng chỉ dùng cho khoản phí lớn hơn 0.');
  const code='MP-'+randomUUID().replace(/-/g,'');
  const r=await this.service.db.query<any>(`SET NOCOUNT ON;SET XACT_ABORT ON;
   BEGIN TRY BEGIN TRANSACTION;
   IF NOT EXISTS(SELECT 1 FROM tuyen_sinh.HoSo h WITH(UPDLOCK,HOLDLOCK)
    JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=q.MaDot
    WHERE h.MaHoSo=@Id AND h.MaNguoi=@Actor AND
     (@Type='XET_TUYEN' AND h.TrangThai='CHO_THANH_TOAN' AND q.LePhi=@Amount
      OR @Type='NHAP_HOC' AND h.TrangThai='XAC_NHAN_NHAP_HOC' AND q.PhiNhapHoc=@Amount AND SYSUTCDATETIME()<=d.HanNhapHoc))
    THROW 51091,N'Hồ sơ không ở trạng thái thanh toán hoặc đã hết hạn nhập học.',1;
   IF EXISTS(SELECT 1 FROM tuyen_sinh.GiaoDich WITH(UPDLOCK,HOLDLOCK) WHERE MaHoSo=@Id AND LoaiPhi=@Type AND TrangThai='DA_TT')
    THROW 51091,N'Khoản phí đã được ghi nhận, không tạo giao dịch trùng.',1;
   DECLARE @Expired TABLE(Code varchar(50));
   UPDATE tuyen_sinh.GiaoDich SET TrangThai='THAT_BAI',KetQuaMoPhong='HET_HAN'
    OUTPUT inserted.MaGiaoDich INTO @Expired WHERE MaHoSo=@Id AND LoaiPhi=@Type AND Kenh='MO_PHONG' AND TrangThai='CHO_TT' AND HanThanhToan<=SYSUTCDATETIME();
   ${audit('QR_MO_PHONG_HET_HAN','SELECT Code FROM @Expired')}
   DECLARE @Existing varchar(50);SELECT @Existing=MaGiaoDich FROM tuyen_sinh.GiaoDich
    WHERE MaHoSo=@Id AND LoaiPhi=@Type AND Kenh='MO_PHONG' AND TrangThai='CHO_TT';
   IF @Existing IS NOT NULL BEGIN ${selectPayment} WHERE MaGiaoDich=@Existing;COMMIT;RETURN;END;
   DECLARE @Expiry datetime2=DATEADD(minute,15,SYSUTCDATETIME());
   IF @Type='NHAP_HOC' SELECT @Expiry=CASE WHEN d.HanNhapHoc<@Expiry THEN d.HanNhapHoc ELSE @Expiry END
    FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=q.MaDot WHERE h.MaHoSo=@Id;
   INSERT tuyen_sinh.GiaoDich(MaGiaoDich,MaHoSo,LoaiPhi,SoTien,Kenh,LaMoPhong,HanThanhToan)
    VALUES(@Code,@Id,@Type,@Amount,'MO_PHONG',1,@Expiry);
   ${audit('TAO_QR_MO_PHONG','@Code')}
   ${selectPayment} WHERE MaGiaoDich=@Code;COMMIT;
   END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Id:id,Actor:actor.sub,IP:actor.ip??null,Type:type,Amount:amount,Code:code});
  return this.present(r.recordset[0]);
 }
 async status(id:number,code:string,actor:AdmissionActor){return this.finish(id,code,null,actor);}
 async finish(id:number,code:string,outcome:DemoOutcome|null,actor:AdmissionActor){
  await this.owner(id,actor);
  if(!/^MP-[a-f0-9]{32}$/.test(code)||outcome!==null&&!['THANH_CONG','THAT_BAI','HET_HAN'].includes(outcome))throw new BadRequestException('Giao dịch hoặc kết quả mô phỏng không hợp lệ.');
  const r=await this.service.db.query<any>(`SET NOCOUNT ON;SET XACT_ABORT ON;
   BEGIN TRY BEGIN TRANSACTION;
   DECLARE @Status varchar(30),@Deadline datetime2,@Fee int;
   SELECT @Status=h.TrangThai,@Deadline=d.HanNhapHoc FROM tuyen_sinh.HoSo h WITH(UPDLOCK,HOLDLOCK)
    JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=q.MaDot WHERE h.MaHoSo=@Id AND h.MaNguoi=@Actor;
   IF @Status IS NULL THROW 51203,N'Không có quyền xử lý hồ sơ này.',1;
   DECLARE @PaymentState varchar(20),@Expiry datetime2,@Type varchar(20),@Amount int;
   SELECT @PaymentState=TrangThai,@Expiry=HanThanhToan,@Type=LoaiPhi,@Amount=SoTien FROM tuyen_sinh.GiaoDich WITH(UPDLOCK,HOLDLOCK)
    WHERE MaGiaoDich=@Code AND MaHoSo=@Id AND Kenh='MO_PHONG' AND LaMoPhong=1;
   IF @PaymentState IS NULL THROW 51091,N'Không tìm thấy giao dịch mô phỏng của hồ sơ.',1;
   IF @PaymentState<>'CHO_TT' OR @Result IS NULL AND @Expiry>SYSUTCDATETIME()
    BEGIN ${selectPayment} WHERE MaGiaoDich=@Code;COMMIT;RETURN;END;
   DECLARE @Final varchar(20)=CASE WHEN @Expiry<=SYSUTCDATETIME() OR @Type='NHAP_HOC' AND @Deadline<SYSUTCDATETIME() THEN 'HET_HAN' ELSE @Result END;
   IF @Final='THANH_CONG' BEGIN
    SELECT @Fee=CASE WHEN @Type='XET_TUYEN' THEN q.LePhi ELSE q.PhiNhapHoc END FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu WHERE h.MaHoSo=@Id;
    IF @Amount<>@Fee OR NOT(@Type='XET_TUYEN' AND @Status='CHO_THANH_TOAN' OR @Type='NHAP_HOC' AND @Status='XAC_NHAN_NHAP_HOC')
     THROW 51091,N'Hồ sơ hoặc số tiền đã thay đổi; không thể chốt mô phỏng.',1;
    IF EXISTS(SELECT 1 FROM tuyen_sinh.GiaoDich WITH(UPDLOCK,HOLDLOCK) WHERE MaHoSo=@Id AND LoaiPhi=@Type AND TrangThai='DA_TT')
     THROW 51091,N'Khoản phí đã được ghi nhận ở giao dịch khác.',1;
   END;
   UPDATE tuyen_sinh.GiaoDich SET TrangThai=CASE WHEN @Final='THANH_CONG' THEN 'DA_TT' ELSE 'THAT_BAI' END,
    KetQuaMoPhong=@Final,HanThanhToan=CASE WHEN @Final='HET_HAN' AND HanThanhToan>SYSUTCDATETIME() THEN SYSUTCDATETIME() ELSE HanThanhToan END,
    MaBienLai=CASE WHEN @Final='THANH_CONG' THEN 'BL-MO-PHONG-'+@Code ELSE NULL END,
    NgayThanhToan=CASE WHEN @Final='THANH_CONG' THEN SYSUTCDATETIME() ELSE NULL END
    WHERE MaGiaoDich=@Code;
   IF @Final='THANH_CONG' AND @Type='XET_TUYEN' UPDATE tuyen_sinh.HoSo SET TrangThai='DA_NOP' WHERE MaHoSo=@Id AND TrangThai='CHO_THANH_TOAN';
   ${audit('KET_QUA_QR_MO_PHONG','@Code')}
   ${selectPayment} WHERE MaGiaoDich=@Code;COMMIT;
   END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK;THROW;END CATCH;`,{Id:id,Code:code,Result:outcome,Actor:actor.sub,IP:actor.ip??null});
  return this.present(r.recordset[0]);
 }
}
