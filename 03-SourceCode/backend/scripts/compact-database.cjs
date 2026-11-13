const fs=require('node:fs'),path=require('node:path'),sql=require('mssql/msnodesqlv8');
const root=path.resolve(__dirname,'../../..');process.loadEnvFile(path.join(__dirname,'../.env'));
const keep=['danh_muc.DonVi','danh_muc.Nganh','danh_muc.Nguoi','nhan_su.CanBo','hoc_thuat.ChuongTrinh','hoc_thuat.PhienBanChuongTrinh','hoc_thuat.HocPhan','hoc_thuat.KhungHocPhan','hoc_thuat.HocPhanTienQuyet','hoc_thuat.HocVien','hoc_thuat.LopHocPhan','hoc_thuat.DangKyHocPhan','he_thong.NhatKyThayDoi','he_thong.TaiKhoanDangNhap','he_thong.YeuCauKhoiPhucMatKhau','hoc_thuat.PhienBanHocPhan','hoc_thuat.LopQuanLy','hoc_thuat.DeTaiHocVien','hoc_thuat.HoiDongBaoVe','hoc_thuat.ThanhVienBaoVe','hoc_thuat.QuyDinhTotNghiep','hoc_thuat.MinhChungNgoaiNgu','hoc_thuat.KetQuaXetTotNghiep','he_thong.VanBanCongKhai','he_thong.DangKyNhanThongTin','he_thong.ThamSoDaoTao'];
(async()=>{const pool=await new sql.ConnectionPool({server:'localhost',connectionString:process.env.SQLSERVER_CONNECTION_STRING,requestTimeout:180000}).connect();try{
 if((await pool.request().query("SELECT OBJECT_ID(N'tuyen_sinh.DotTuyen',N'U') AS Id")).recordset[0].Id)throw Error('Admissions is required. Legacy compact-database is disabled.');
 const info=(await pool.request().query("SELECT DB_NAME() AS Db,CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS BackupPath")).recordset[0];
 if(['master','model','msdb','tempdb'].includes(info.Db))throw Error('System databases are forbidden');
 const inventory=async()=>(await pool.request().query("SELECT s.name+'.'+t.name AS Name FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY s.name,t.name")).recordset.map(r=>r.Name);
 const before=await inventory();for(const name of keep)if(!before.includes(name))throw Error('Required table missing: '+name);
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({preview:true,keep,remove:before.filter(n=>!keep.includes(n))},null,2));return;}
 if(before.length===keep.length){console.log('Database already contains only the 26 retained tables.');return;}
 if(!info.BackupPath||!path.win32.isAbsolute(info.BackupPath))throw Error('SQL Server backup folder unavailable.');
 const backup=path.win32.join(info.BackupPath,info.Db.replace(/[^a-zA-Z0-9_-]/g,'_')+'_truoc_tinh_gon_'+Date.now()+'.bak');
 const database='['+info.Db.replace(/]/g,']]')+']';
 await pool.request().input('File',sql.NVarChar(4000),backup).query(`BACKUP DATABASE ${database} TO DISK=@File WITH COPY_ONLY,CHECKSUM;`);
 await pool.request().input('File',sql.NVarChar(4000),backup).query('RESTORE VERIFYONLY FROM DISK=@File WITH CHECKSUM;');
 const snapshot=async()=>{const values={};for(const name of keep){const result=(await pool.request().query(`SELECT COUNT_BIG(*) AS N,CHECKSUM_AGG(BINARY_CHECKSUM(*)) AS C FROM ${name}`)).recordset[0];values[name]=result;}return values;};
 const original=await snapshot();
 const source=fs.readFileSync(path.join(root,'04_Infrastructure/SQLServer/07_TinhGonDuLieuCu.sql'),'utf8');
 await pool.request().query("EXEC sys.sp_set_session_context @key=N'ChoPhepTinhGon',@value=1;"+source);
 const after=await inventory();if(JSON.stringify([...after].sort())!==JSON.stringify([...keep].sort()))throw Error('Unexpected tables remain; inspect database. Backup: '+backup);
 const current=await snapshot();for(const name of keep){if(current[name].N!==original[name].N)throw Error('Retained row count differs: '+name);if(name!=='hoc_thuat.HocVien'&&current[name].C!==original[name].C)throw Error('Retained content differs: '+name);}
 const report={completedAt:new Date().toISOString(),database:info.Db,before:before.length,after:after.length,removed:before.filter(n=>!keep.includes(n)),retained:after,backup,backupVerified:true,retainedRowCountsPreserved:true};
 fs.writeFileSync(path.join(root,'05_Testing/TinhGonSQL.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await pool.close();}})().catch(error=>{console.error(error.message);process.exitCode=1;});
