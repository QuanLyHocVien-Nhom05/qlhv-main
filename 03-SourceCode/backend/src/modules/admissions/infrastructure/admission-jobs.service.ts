import {Injectable,Logger,OnModuleDestroy,OnModuleInit,ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {AdmissionsService} from '../application/admissions.service';
import {AdmissionFiles} from './admission-files.service';
import {ExternalAdapters} from './external.adapters';
import {RecoveryMailer} from '../../password-recovery/infrastructure/recovery-mailer';
import {sessionRole} from '../../../shared/security/roles';
import {processBatchSchedule} from './admission-schedule';
@Injectable()
export class AdmissionJobs implements OnModuleInit,OnModuleDestroy{
 private timer?:ReturnType<typeof setInterval>;private busy=false;private logger=new Logger(AdmissionJobs.name);
 constructor(private readonly service:AdmissionsService,private readonly files:AdmissionFiles,private readonly adapters:ExternalAdapters,private readonly mailer:RecoveryMailer,private readonly config:ConfigService){}
 onModuleInit(){if(this.config.get('ADMISSION_JOBS_AUTO','true')==='true'){this.timer=setInterval(()=>void this.tick(),5000);this.timer.unref();}}
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
 async tick(){if(this.busy)return;this.busy=true;try{for(const run of [()=>this.processSchedule(),()=>this.processOcr(),()=>this.processScores(),()=>this.processNotice(),()=>this.processEnrollment()])try{await run();}catch{this.logger.error('Tác vụ tuyển sinh chưa xử lý được; xem trạng thái hàng đợi.');}}finally{this.busy=false;}}
 async processSchedule(){await this.service.db.query(processBatchSchedule);}
 async processScores(){const row=(await this.service.db.query<any>(`SELECT TOP(1) h.MaHoSo FROM tuyen_sinh.HoSo h JOIN tuyen_sinh.ChiTieu q ON q.MaChiTieu=h.MaChiTieu JOIN tuyen_sinh.DotTuyen d ON d.MaDot=q.MaDot WHERE h.TrangThai='DU_DIEU_KIEN' AND d.CongBoDiem=0 AND d.TrangThai IN('DANG_MO','DA_DONG') AND NOT EXISTS(SELECT 1 FROM tuyen_sinh.KetQua k WHERE k.MaHoSo=h.MaHoSo) AND(SELECT COUNT(*) FROM tuyen_sinh.PhanPhong p JOIN tuyen_sinh.DiemBaiThi b ON b.MaPhanPhong=p.MaPhanPhong WHERE p.MaHoSo=h.MaHoSo AND p.ThanhPhan IN('CO_SO','CHUYEN_NGANH'))=2 ORDER BY h.MaHoSo`)).recordset[0];if(row)await this.service.aggregatePapers(Number(row.MaHoSo));}
 async processEnrollment(){
  const row=(await this.service.db.query<any>(`UPDATE h SET LanThuBanGiao=SYSUTCDATETIME() OUTPUT inserted.MaHoSo,p.MaNguoiCauHinh,t.VaiTro FROM tuyen_sinh.HoSo h WITH(UPDLOCK,READPAST,ROWLOCK) JOIN tuyen_sinh.KeHoachNhapHoc p ON p.MaChiTieu=h.MaChiTieu JOIN he_thong.TaiKhoanDangNhap t ON t.MaNguoi=p.MaNguoiCauHinh WHERE h.MaHoSo=(SELECT TOP(1) x.MaHoSo FROM tuyen_sinh.HoSo x JOIN tuyen_sinh.KeHoachNhapHoc k ON k.MaChiTieu=x.MaChiTieu JOIN he_thong.TaiKhoanDangNhap ownerAccount ON ownerAccount.MaNguoi=k.MaNguoiCauHinh AND ownerAccount.VaiTro IN('ADMIN','CAN_BO') AND ownerAccount.DangHoatDong=1 AND ownerAccount.DaXoa=0 WHERE x.TrangThai='XAC_NHAN_NHAP_HOC' AND k.TuDong=1 AND(x.LanThuBanGiao IS NULL OR x.LanThuBanGiao<DATEADD(minute,-10,SYSUTCDATETIME())) AND EXISTS(SELECT 1 FROM tuyen_sinh.GiaoDich g WHERE g.MaHoSo=x.MaHoSo AND g.LoaiPhi='NHAP_HOC' AND g.TrangThai='DA_TT' AND(g.LaMoPhong=0 OR @AllowDemo=1)) ORDER BY x.MaHoSo) AND h.TrangThai='XAC_NHAN_NHAP_HOC' AND p.TuDong=1 AND t.VaiTro IN('ADMIN','CAN_BO') AND t.DangHoatDong=1 AND t.DaXoa=0 AND(h.LanThuBanGiao IS NULL OR h.LanThuBanGiao<DATEADD(minute,-10,SYSUTCDATETIME()))`,{AllowDemo:this.service.allowDemoPayments()})).recordset[0];
  if(!row)return;
  try{await this.service.enroll(Number(row.MaHoSo),undefined,null,{sub:String(row.MaNguoiCauHinh),roles:[sessionRole(row.VaiTro)!]},true);}
  catch{await this.service.db.query(`UPDATE tuyen_sinh.HoSo SET LoiBanGiao=N'Chưa thể bàn giao tự động. Cán bộ cần kiểm tra CTĐT, lớp, sĩ số, người hướng dẫn và thời điểm hoàn tất phí.' WHERE MaHoSo=@Id AND TrangThai='XAC_NHAN_NHAP_HOC'`,{Id:row.MaHoSo});}
 }
 async processOcr(){const doc=(await this.service.db.query<any>(`UPDATE TOP(1) tuyen_sinh.TaiLieu WITH(UPDLOCK,READPAST,ROWLOCK) SET TrangThaiOcr='DANG_XU_LY' OUTPUT inserted.MaTaiLieu,inserted.MaHoSo,inserted.KhoaLuuTru,inserted.LoaiNoiDung,inserted.LoaiTaiLieu WHERE TrangThaiOcr='CHO_XU_LY'`)).recordset[0];if(!doc)return;
  try{const value=await this.adapters.ocr(await this.files.read(doc.KhoaLuuTru),doc.LoaiNoiDung,doc.LoaiTaiLieu);await this.service.db.query('UPDATE tuyen_sinh.TaiLieu SET TrangThaiOcr=@State,DuLieuOcrMaHoa=@Data WHERE MaTaiLieu=@Id',{State:value.CanKiemTra?'CAN_KIEM_TRA':'HOAN_THANH',Data:this.service.crypto.encode(value,'admission-ocr'),Id:doc.MaTaiLieu});}catch(e){await this.service.db.query('UPDATE tuyen_sinh.TaiLieu SET TrangThaiOcr=@State WHERE MaTaiLieu=@Id',{State:e instanceof ServiceUnavailableException?'CAN_KIEM_TRA':'LOI',Id:doc.MaTaiLieu});}
  // Resolve current association after OCR: upload/attach may run while recognition is pending.
  const current=(await this.service.db.query<any>('SELECT MaHoSo FROM tuyen_sinh.TaiLieu WHERE MaTaiLieu=@Id',{Id:doc.MaTaiLieu})).recordset[0];
  if(current?.MaHoSo)await this.service.preScreen(Number(current.MaHoSo));
 }
 async processNotice(){const item=(await this.service.db.query<any>(`UPDATE TOP(1) tuyen_sinh.HangDoiThongBao WITH(UPDLOCK,READPAST,ROWLOCK) SET TrangThai='DANG_GUI',SoLanThu=SoLanThu+1 OUTPUT inserted.* WHERE TrangThai='CHO_GUI' AND SoLanThu<5`)).recordset[0];if(!item)return;
  try{const h=(await this.service.db.query<any>('SELECT h.MaNguoi,h.HoSoMaHoa,n.ThuDienTu FROM tuyen_sinh.HoSo h JOIN danh_muc.Nguoi n ON n.MaNguoi=h.MaNguoi WHERE h.MaHoSo=@Id',{Id:item.MaHoSo})).recordset[0];if(!h)throw new Error('Missing owner');const body=this.service.crypto.decode<any>(item.NoiDungMaHoa,'admission-notice');if(item.Kenh==='EMAIL'){if(!h.ThuDienTu)throw new Error('Missing email');await this.mailer.sendNotification(h.ThuDienTu,'Cập nhật tuyển sinh',body.message);}else{if(!this.adapters.status().sms)throw new ServiceUnavailableException();const profile=this.service.crypto.decode<any>(h.HoSoMaHoa,'admission-profile:'+h.MaNguoi);await this.adapters.sms(profile.DienThoai,body.message);}await this.service.db.query("UPDATE tuyen_sinh.HangDoiThongBao SET TrangThai='DA_GUI' WHERE MaThongBao=@Id",{Id:item.MaThongBao});}
  catch(e){await this.service.db.query('UPDATE tuyen_sinh.HangDoiThongBao SET TrangThai=@State WHERE MaThongBao=@Id',{State:e instanceof ServiceUnavailableException?'CHO_CAU_HINH':'LOI',Id:item.MaThongBao});}
 }
}
