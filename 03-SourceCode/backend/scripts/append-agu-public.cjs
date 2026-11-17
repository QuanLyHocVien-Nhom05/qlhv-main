const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sql=require('mssql/msnodesqlv8');
const backend=path.resolve(__dirname,'..'),root=path.resolve(backend,'../..');
const dataset=()=>JSON.parse(fs.readFileSync(path.join(backend,'data/agu-public-20261117.json'),'utf8'));
function validate(data){
 assert.equal(data.version,1);assert.equal(data.mode,'APPEND_ONLY');assert.equal(data.verification,'TAI_TEP_GOC');
 assert.match(data.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.equal(data.units.length,10);assert.equal(data.majors.length,3);assert.equal(data.intakes.length,2);assert.equal(data.documents.length,15);
 const codes=new Set(),urls=new Set();for(const d of data.documents){
  assert.ok(!codes.has(d.code)&&!urls.has(d.url));codes.add(d.code);urls.add(d.url);
  assert.match(d.url,/^https:\/\/tuyensinh\.agu\.edu\.vn\/uploads\/[a-f0-9]+\.(pdf|jpg|docx?)$/);
  assert.equal(path.basename(d.file),d.file);assert.ok(d.note.length<=1000&&d.title.length<=300&&d.code.length<=100);
  const file=path.join(backend,'../frontend/public/tai-lieu',d.file);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),d.sha256,'Tệp nguồn thay đổi: '+d.file);
 }
 assert.equal(data.intakes[0].quotas.reduce((n,q)=>n+q.quantity,0),285);assert.equal(data.intakes[1].quotas.reduce((n,q)=>n+q.quantity,0),6);
 for(const a of data.intakes){assert.ok(a.closedUtc<data.checkedOn);assert.ok(data.documents.some(d=>d.file===a.sourceFile));assert.equal(new Set(a.quotas.map(q=>q.code)).size,a.quotas.length);for(const q of a.quotas)assert.ok(Number.isSafeInteger(q.quantity)&&q.quantity>0);}
 return data;
}
async function append(pool,data,actorId,origin='http://localhost:3000'){
 validate(data);const web=new URL(origin);assert.ok(web.protocol==='https:'||(web.protocol==='http:'&&['localhost','127.0.0.1'].includes(web.hostname)));const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
 const query=async(text,values={})=>{const r=new sql.Request(tx);for(const[k,v]of Object.entries(values))r.input(k,typeof v==='boolean'?sql.Bit:typeof v==='number'?sql.Decimal(19,4):sql.NVarChar(sql.MAX),v??null);return r.query(text);};
 const result={unitsAdded:0,majorsAdded:0,programsAdded:0,documentsAdded:0,intakesAdded:0,quotasAdded:0,certificateThresholdsAdded:0,inputMajorRulesAdded:0};
 const source=file=>{const d=data.documents.find(d=>d.file===file);assert.ok(d,'Thiếu tài liệu nguồn');return d;};
 try{
  await query('SET XACT_ABORT ON;SET QUOTED_IDENTIFIER ON;SET ARITHABORT ON;');
  assert.ok((await query("SELECT 1 FROM he_thong.TaiKhoanDangNhap WHERE MaNguoi=@Actor AND VaiTro='ADMIN' AND DangHoatDong=1 AND DaXoa=0",{Actor:String(actorId)})).recordset.length,'Cần quản trị viên đang hoạt động');
  const schools=(await query("SELECT MaDonVi FROM danh_muc.DonVi WHERE KyHieu='TRUONG_DH_AN_GIANG'")).recordset;assert.equal(schools.length,1,'Cần danh mục AGU gốc trước khi bổ sung');const unit=Number(schools[0].MaDonVi);
  for(const u of data.units){const found=(await query('SELECT KyHieu,TenDonVi FROM danh_muc.DonVi WITH(UPDLOCK,HOLDLOCK) WHERE KyHieu=@Code OR TenDonVi=@Name',{Code:u.code,Name:u.name})).recordset;if(found.length){assert.equal(found.length,1);assert.equal(found[0].TenDonVi,u.name);continue;}
   await query('INSERT danh_muc.DonVi(KyHieu,TenDonVi,LoaiDonVi,MaDonViCha,DangHoatDong) VALUES(@Code,@Name,@Type,@Parent,1)',{Code:u.code,Name:u.name,Type:u.type,Parent:unit});result.unitsAdded++;}
  for(const n of data.majors){let rows=(await query('SELECT MaNganh,TenNganh FROM danh_muc.Nganh WITH(UPDLOCK,HOLDLOCK) WHERE KyHieu=@Code',{Code:n.code})).recordset;assert.ok(rows.length<=1);
   if(rows.length)assert.equal(rows[0].TenNganh,n.name,'Mã ngành trùng tên khác');
   else{rows=(await query('INSERT danh_muc.Nganh(KyHieu,TenNganh,MaDonVi,DangHoatDong) OUTPUT inserted.MaNganh VALUES(@Code,@Name,@Unit,@Active)',{Code:n.code,Name:n.name,Unit:unit,Active:!n.proposed})).recordset;result.majorsAdded++;}
   const major=Number(rows[0].MaNganh),program=(await query('SELECT MaChuongTrinh FROM hoc_thuat.ChuongTrinh WHERE MaNganh=@Major AND TrinhDo=@Degree',{Major:major,Degree:n.degree})).recordset;
   if(!program.length){const d=source(n.sourceFile);await query(`INSERT hoc_thuat.ChuongTrinh(KyHieu,TenChuongTrinh,MaNganh,TrinhDo,NguonUrl,BanSaoUrl,MoTaNguon,ThoiGianChuanThang,HienThiCongKhai) VALUES(@Code,@Name,@Major,@Degree,@Source,@Copy,@Note,@Months,1)`,{Code:(n.degree==='TIEN_SI'?'TS_':'THS_')+n.code,Name:(n.degree==='TIEN_SI'?'Tiến sĩ ':'Thạc sĩ ')+n.name+(n.proposed?' (dự kiến)':''),Major:major,Degree:n.degree,Source:d.url,Copy:'/tai-lieu/'+d.file,Note:n.note,Months:n.months});result.programsAdded++;}
  }
  for(const d of data.documents){const rows=(await query('SELECT NguonUrl FROM he_thong.VanBanCongKhai WITH(UPDLOCK,HOLDLOCK) WHERE SoVanBan=@Code OR NguonUrl=@Source',{Code:d.code,Source:d.url})).recordset;
   if(rows.length){assert.ok(rows.length===1&&rows[0].NguonUrl===d.url,'Trùng mã văn bản khác nguồn: '+d.code);continue;}
   await query(`INSERT he_thong.VanBanCongKhai(SoVanBan,TieuDe,PhanLoai,NgayBanHanh,DuongDan,TrangThai,NguonUrl,MaDinhDanhNoiBo,GhiChuNguon,NgayKiemChung,KieuKiemChung) VALUES(@Code,@Title,@Category,TRY_CONVERT(date,@Issued),@Copy,'CONG_BO',@Source,@Internal,@Note,CONVERT(date,@Checked),@Verification)`,{Code:d.code,Title:d.title,Category:d.category,Issued:d.issuedOn,Copy:new URL('/tai-lieu/'+d.file,web).href,Source:d.url,Internal:d.internalCode,Note:d.note,Checked:data.checkedOn,Verification:data.verification});result.documentsAdded++;
  }
  for(const a of data.intakes){const d=source(a.sourceFile);let batch=(await query('SELECT MaDot,NguonUrl,TrangThai FROM tuyen_sinh.DotTuyen WITH(UPDLOCK,HOLDLOCK) WHERE KyHieu=@Code',{Code:a.code})).recordset[0];
   if(batch){assert.equal(batch.NguonUrl,d.url);assert.equal(batch.TrangThai,'DA_DONG','Không sửa đợt đang vận hành');}
   else{batch=(await query(`INSERT tuyen_sinh.DotTuyen(KyHieu,TenDot,DongHoSo,TrangThai,NguonUrl,BanSaoUrl,SoVanBan,NgayBanHanh,NhapHocDuKien,GhiChuNguon,NgayKiemChung,KieuKiemChung) OUTPUT inserted.MaDot VALUES(@Code,@Title,CONVERT(datetime2,@Closed),'DA_DONG',@Source,@Copy,@Document,CONVERT(date,@Issued),@Enrollment,@Note,CONVERT(date,@Checked),@Verification)`,{Code:a.code,Title:a.title,Closed:a.closedUtc,Source:d.url,Copy:'/tai-lieu/'+d.file,Document:a.documentCode,Issued:a.issuedOn,Enrollment:a.expectedEnrollment,Note:a.note,Checked:data.checkedOn,Verification:data.verification})).recordset[0];result.intakesAdded++;}
   for(const q of a.quotas){const majors=(await query('SELECT MaNganh FROM danh_muc.Nganh WHERE KyHieu=@Code',{Code:q.code})).recordset;assert.equal(majors.length,1,'Thiếu ngành '+q.code);
    const values={Batch:Number(batch.MaDot),Major:Number(majors[0].MaNganh),Degree:a.degree,Quantity:q.quantity,Fee:a.registrationFee+a.selectionFee,Registration:a.registrationFee,Selection:a.selectionFee,Proposed:a.proposed||q.proposed};
    const existing=(await query("SELECT MaChiTieu,SoLuong,LePhi,PhiDangKy,PhiXetTuyen,QuyTacDaXacNhan FROM tuyen_sinh.ChiTieu WHERE MaDot=@Batch AND MaNganh=@Major AND TrinhDo=@Degree AND PhuongThuc='CHUNG'",values)).recordset;
    if(existing.length){assert.ok(existing.length===1&&existing[0].SoLuong===q.quantity&&existing[0].LePhi===values.Fee&&existing[0].PhiDangKy===values.Registration&&existing[0].PhiXetTuyen===values.Selection&&!existing[0].QuyTacDaXacNhan,'Chỉ tiêu đã thay đổi; không ghi đè');continue;}
    const quota=(await query(`INSERT tuyen_sinh.ChiTieu(MaDot,MaNganh,TrinhDo,PhuongThuc,SoLuong,LePhi,TaiLieuBatBuoc,QuyTacDaXacNhan,DuKien,PhiDangKy,PhiXetTuyen,PhiNhapHoc,GpaToiThieu,HeSoCoSo,HeSoChuyenNganh,HeSoNgoaiNgu,HeSoUuTien,DiemSan,TieuChiPhu) OUTPUT inserted.MaChiTieu VALUES(@Batch,@Major,@Degree,'CHUNG',@Quantity,@Fee,N'[]',0,@Proposed,@Registration,@Selection,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)`,values)).recordset[0];result.quotasAdded++;
    for(const c of a.certificates){await query('INSERT tuyen_sinh.ChuanNgoaiNgu(MaChiTieu,TenChungChi,DiemToiThieu,DiemQuyDoi,BacTuongDuong) VALUES(@Quota,@Name,@Minimum,NULL,@Level)',{Quota:Number(quota.MaChiTieu),Name:c.name,Minimum:c.minimum,Level:c.level});result.certificateThresholdsAdded++;}
    for(const name of a.majorRules){await query("INSERT tuyen_sinh.NganhDauVao(MaChiTieu,TenNganh,PhanLoai,MonBoSung) VALUES(@Quota,@Name,'DUNG',NULL)",{Quota:Number(quota.MaChiTieu),Name:name});result.inputMajorRulesAdded++;}
   }
  }
  if(Object.values(result).some(n=>n>0))await query(`INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet) VALUES('HE_THONG','DuLieuCongKhai',0,'BO_SUNG_DU_LIEU_AGU',@Actor,@Detail)`,{Actor:String(actorId),Detail:JSON.stringify({checkedOn:data.checkedOn,...result})});
  await tx.commit();return result;
 }catch(error){try{await tx.rollback();}catch{}throw error;}
}
async function snapshot(pool){
 const tables=(await pool.request().query("SELECT s.name AS S,t.name AS T FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0")).recordset;
 const result={};for(const t of tables){const name=t.S+'.'+t.T;assert.match(name,/^[a-z_]+\.[a-zA-Z_]+$/);const rows=(await pool.request().query('SELECT * FROM ['+t.S+'].['+t.T+']')).recordset;result[name]=rows.map(row=>crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex')).sort();}return result;
}
function preserved(before,after){for(const[name,rows]of Object.entries(before)){const current=new Set(after[name]);assert.ok(rows.every(row=>current.has(row)),'Bản ghi hiện có bị thay đổi: '+name);}}
module.exports={dataset,validate,append,snapshot,preserved};
if(require.main===module)(async()=>{const data=validate(dataset());if(!process.argv.includes('--apply')){console.log(JSON.stringify({preview:true,units:10,majors:3,programs:3,documents:15,intakes:2,quotas:14,unavailable:data.unavailable},null,2));return;}
 process.loadEnvFile(path.join(backend,'.env'));assert.notEqual(process.env.NODE_ENV,'production');const pool=await new sql.ConnectionPool({server:'localhost',connectionString:process.env.SQLSERVER_CONNECTION_STRING,requestTimeout:180000}).connect();try{
  const info=(await pool.request().query("SELECT DB_NAME() AS Db,CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS Folder")).recordset[0];assert.equal(info.Db,'QuanLyChuongTrinhDaoTao');assert.ok(path.win32.isAbsolute(info.Folder));
  const backup=path.win32.join(info.Folder,info.Db+'_truoc_bo_sung_AGU_'+Date.now()+'.bak');await pool.request().input('File',sql.NVarChar(4000),backup).query('BACKUP DATABASE [QuanLyChuongTrinhDaoTao] TO DISK=@File WITH COPY_ONLY,CHECKSUM');await pool.request().input('File',sql.NVarChar(4000),backup).query('RESTORE VERIFYONLY FROM DISK=@File WITH CHECKSUM');
  const actor=(await pool.request().query("SELECT TOP(1) MaNguoi FROM he_thong.TaiKhoanDangNhap WHERE VaiTro='ADMIN' AND DangHoatDong=1 AND DaXoa=0 ORDER BY MaTaiKhoan")).recordset[0];assert.ok(actor);
  const before=await snapshot(pool);const result=await append(pool,data,actor.MaNguoi,process.env.PUBLIC_WEB_ORIGIN??process.env.FRONTEND_ORIGIN??'http://localhost:3000');preserved(before,await snapshot(pool));const repeated=await append(pool,data,actor.MaNguoi);assert.ok(Object.values(repeated).every(n=>n===0));preserved(before,await snapshot(pool));
  const report={completedAt:new Date().toISOString(),mode:data.mode,backupVerified:true,...result,idempotent:true,existingRowsPreserved:true,manifestSha256:crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),sourceUrls:data.documents.map(d=>d.url)};
  fs.writeFileSync(path.join(root,'05_Testing/BoSungAGUCongKhai20261117.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(root,'.tools/agu-public-backup.local.json'),JSON.stringify({backup,verified:true},null,2));console.log(JSON.stringify(report,null,2));
 }finally{await pool.close();}})().catch(error=>{console.error(error.message);process.exitCode=1;});
