const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sql=require('mssql/msnodesqlv8');
const backend=path.resolve(__dirname,'..'),root=path.resolve(backend,'../..');
const dataset=()=>JSON.parse(fs.readFileSync(path.join(backend,'data/agu-supplement.json'),'utf8'));
function validate(data){
 assert.equal(data.version,1);assert.equal(data.site,'https://pgd.agu.edu.vn/');assert.equal(data.verification,'CHI_MUC_TIM_KIEM');
 assert.match(data.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(data.checkedOn).toISOString().slice(0,10),data.checkedOn);
 assert.equal(data.documents.length,5);const codes=new Set(),urls=new Set();
 for(const d of data.documents){assert.ok(typeof d.code==='string'&&d.code.length>0&&d.code.length<=100);assert.equal(typeof d.internalCode,'boolean');assert.ok(!codes.has(d.code)&&!urls.has(d.url));codes.add(d.code);urls.add(d.url);assert.match(d.url,/^https:\/\/pgd\.agu\.edu\.vn\/storage\/[a-f0-9]{32}\.pdf$/);assert.ok(['TUYEN_SINH','QUY_DINH','HUONG_DAN'].includes(d.category));assert.ok(d.title.length>0&&d.title.length<=300&&d.note.length<=1000);if(d.issuedOn!==null){assert.match(d.issuedOn,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(d.issuedOn).toISOString().slice(0,10),d.issuedOn);assert.ok(d.issuedOn<=data.checkedOn);}}
 const a=data.announcement;assert.equal(a.code,'TS_AGU_2024_CHUNG');assert.equal(a.documentCode,'1103/TB-ĐHAG');assert.equal(a.url,data.documents[0].url);assert.equal(a.issuedOn,'2024-08-07');assert.equal(a.quotas.length,6);assert.equal(new Set(a.quotas.map(q=>q.majorCode)).size,6);assert.equal(a.quotas.reduce((s,q)=>s+q.quantity,0),175);
 for(const q of a.quotas){assert.match(q.majorCode,/^8\d{6}$/);assert.ok(Number.isSafeInteger(q.quantity)&&q.quantity>0&&typeof q.majorName==='string');}
 return data;
}
async function augment(pool,data,actorId){
 validate(data);assert.match(String(actorId),/^[1-9]\d*$/);const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
 const query=async(text,values={})=>{const r=new sql.Request(tx);for(const[k,v]of Object.entries(values))r.input(k,typeof v==='boolean'?sql.Bit:typeof v==='number'?sql.Decimal(19,4):sql.NVarChar(sql.MAX),v??null);return r.query(text);};
 const result={documentsAdded:0,documentsSkipped:0,announcementsAdded:0,quotasAdded:0,quotasSkipped:0,annualQuota:175,verification:data.verification};
 try{
  await query('SET XACT_ABORT ON;SET QUOTED_IDENTIFIER ON;SET ARITHABORT ON;');
  assert.ok((await query("SELECT 1 AS Allowed FROM he_thong.TaiKhoanDangNhap WHERE MaNguoi=@Actor AND VaiTro='ADMIN' AND DangHoatDong=1 AND DaXoa=0",{Actor:String(actorId)})).recordset.length,'Active administrator required');
  const majors=new Map();for(const q of data.announcement.quotas){const major=(await query('SELECT MaNganh FROM danh_muc.Nganh WHERE KyHieu=@Code',{Code:q.majorCode})).recordset;assert.equal(major.length,1,'Cần danh mục ngành AGU hiện có: '+q.majorCode);majors.set(q.majorCode,Number(major[0].MaNganh));}
  for(const d of data.documents){
   const existing=(await query('SELECT MaVanBan,NguonUrl FROM he_thong.VanBanCongKhai WITH(UPDLOCK,HOLDLOCK) WHERE SoVanBan=@Code OR NguonUrl=@Source',{Code:d.code,Source:d.url})).recordset;
   if(existing.length){assert.ok(existing.length===1&&existing[0].NguonUrl===d.url,'Trùng mã văn bản khác nguồn: '+d.code);result.documentsSkipped++;continue;}
   await query(`INSERT he_thong.VanBanCongKhai(SoVanBan,TieuDe,PhanLoai,NgayBanHanh,DuongDan,TrangThai,NguonUrl,MaDinhDanhNoiBo,GhiChuNguon,NgayKiemChung,KieuKiemChung) VALUES(@Code,@Title,@Category,TRY_CONVERT(date,@Issued),@Source,'CONG_BO',@Source,@Internal,@Note,CONVERT(date,@Checked),@Verification)`,{Code:d.code,Title:d.title,Category:d.category,Issued:d.issuedOn,Source:d.url,Internal:d.internalCode,Note:d.note,Checked:data.checkedOn,Verification:data.verification});result.documentsAdded++;
  }
  const a=data.announcement;let batch=(await query('SELECT MaDot,NguonUrl,TrangThai FROM tuyen_sinh.DotTuyen WITH(UPDLOCK,HOLDLOCK) WHERE KyHieu=@Code',{Code:a.code})).recordset[0];
  if(batch){assert.equal(batch.NguonUrl,a.url,'Mã đợt trùng nguồn khác');assert.equal(batch.TrangThai,'DA_DONG','Không sửa đợt đang vận hành');}
  else{batch=(await query(`INSERT tuyen_sinh.DotTuyen(KyHieu,TenDot,TrangThai,NguonUrl,SoVanBan,NgayBanHanh,NhapHocDuKien,GhiChuNguon,NgayKiemChung,KieuKiemChung) OUTPUT inserted.MaDot VALUES(@Code,@Title,'DA_DONG',@Source,@Document,CONVERT(date,@Issued),@Enrollment,@Note,CONVERT(date,@Checked),@Verification)`,{Code:a.code,Title:a.title,Source:a.url,Document:a.documentCode,Issued:a.issuedOn,Enrollment:a.expectedEnrollment,Note:a.note,Checked:data.checkedOn,Verification:data.verification})).recordset[0];result.announcementsAdded++;}
  for(const q of a.quotas){
   const existing=(await query("SELECT MaChiTieu,SoLuong FROM tuyen_sinh.ChiTieu WITH(UPDLOCK,HOLDLOCK) WHERE MaDot=@Batch AND MaNganh=@Major AND TrinhDo='THAC_SI' AND PhuongThuc='CHUNG'",{Batch:String(batch.MaDot),Major:majors.get(q.majorCode)})).recordset;
   if(existing.length){assert.ok(existing.length===1&&existing[0].SoLuong===q.quantity,'Chỉ tiêu đã được chỉnh sửa; không ghi đè');result.quotasSkipped++;continue;}
   await query(`INSERT tuyen_sinh.ChiTieu(MaDot,MaNganh,TrinhDo,PhuongThuc,SoLuong,LePhi,TaiLieuBatBuoc,QuyTacDaXacNhan,PhiNhapHoc,GpaToiThieu,HeSoCoSo,HeSoChuyenNganh,HeSoNgoaiNgu,HeSoUuTien,DiemSan,TieuChiPhu) VALUES(@Batch,@Major,'THAC_SI','CHUNG',@Quantity,NULL,N'[]',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)`,{Batch:String(batch.MaDot),Major:majors.get(q.majorCode),Quantity:q.quantity});result.quotasAdded++;
  }
  if(result.documentsAdded+result.announcementsAdded+result.quotasAdded)await query(`INSERT he_thong.NhatKyThayDoi(PhanHe,TenDoiTuong,MaDoiTuong,HanhDong,MaNguoiThucHien,ChiTiet) VALUES('HE_THONG','DuLieuCongKhai',@Id,'BO_SUNG_DU_LIEU_AGU',@Actor,@Detail)`,{Id:String(batch.MaDot),Actor:String(actorId),Detail:JSON.stringify({site:data.site,checkedOn:data.checkedOn,...result})});
  await tx.commit();return result;
 }catch(error){try{await tx.rollback();}catch{}throw error;}
}
module.exports={dataset,validate,augment};
if(require.main===module){(async()=>{const data=validate(dataset());if(!process.argv.includes('--apply')){console.log(JSON.stringify({preview:true,documents:data.documents.length,annualIntakes:1,quotas:data.announcement.quotas.length,totalAnnualQuota:175,source:data.site,verification:data.verification,mode:'append-only; no account, program or operational-profile replacement'},null,2));return;}
 process.loadEnvFile(path.join(backend,'.env'));if(process.env.NODE_ENV==='production')throw Error('Chỉ bổ sung tự động trong môi trường cục bộ đã được chỉ định.');const pool=await new sql.ConnectionPool({server:'localhost',connectionString:process.env.SQLSERVER_CONNECTION_STRING,requestTimeout:60000}).connect();try{
  assert.equal((await pool.request().query('SELECT DB_NAME() AS Name')).recordset[0].Name,'QuanLyChuongTrinhDaoTao');
  await require('./core-database.cjs').apply(pool,false);
  const actor=(await pool.request().query("SELECT TOP(1) MaNguoi FROM he_thong.TaiKhoanDangNhap WHERE VaiTro='ADMIN' AND DangHoatDong=1 AND DaXoa=0 ORDER BY CASE WHEN TenDangNhap='admin' THEN 0 ELSE 1 END,MaTaiKhoan")).recordset[0];assert.ok(actor,'Cần tài khoản quản trị đang hoạt động.');
  const result=await augment(pool,data,actor.MaNguoi);const report={completedAt:new Date().toISOString(),mode:'APPEND_ONLY',...result,sourceFileHash:crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),directAccess:data.directAccess,sourceUrls:data.documents.map(d=>d.url)};fs.writeFileSync(path.join(root,'05_Testing/BoSungDuLieuAGU.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await pool.close();}})().catch(error=>{console.error(error.message);process.exitCode=1;});}
