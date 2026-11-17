const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {setTimeout:pause}=require('node:timers/promises');
const percentile=(values,p)=>values.length?values[Math.min(values.length-1,Math.ceil(values.length*p)-1)]:0;
async function run({pool,call,base,password,ok,durationSeconds=30}){
 const db=(await pool.request().query('SELECT DB_NAME() AS Name')).recordset[0].Name;
 assert.match(db,/^QLCTDT_Test_[a-f0-9]{12}$/,'Load tests may seed only an isolated test database');
 const url=new URL(base);assert.ok(['localhost','127.0.0.1'].includes(url.hostname),'Only a local isolated server is allowed');
 assert.ok(durationSeconds>=10&&durationSeconds<=120);
 const {DataProtection}=require('../dist/shared/security/data-protection'),{ConfigService}=require('@nestjs/config');
 const vault=new DataProtection(new ConfigService({DATA_ENCRYPTION_KEY:process.env.DATA_ENCRYPTION_KEY}));
 const users=50,iso=days=>new Date(Date.now()+days*86400000).toISOString();
 const major=(await call('/management/options/majors'))[0];assert.ok(major);
 await call('/management/admission-batches',{values:{KyHieu:'LOAD_50',TenDot:'Synthetic load test 50 users',MoHoSo:iso(-1),DongHoSo:iso(1),HanThamDinh:iso(2),HanBoSung:iso(2),NgayThi:iso(3),NgayCongBo:iso(4),HanPhucKhao:iso(5),HanNhapHoc:iso(6)}},201);
 const dot=(await pool.request().query("SELECT MaDot FROM tuyen_sinh.DotTuyen WHERE KyHieu='LOAD_50'")).recordset[0].MaDot;
 await call('/management/admission-quotas',{values:{MaDot:dot,MaNganh:Number(major.Id),TrinhDo:'THAC_SI',PhuongThuc:'XET_TUYEN',SoLuong:50,LePhi:0,PhiNhapHoc:0,GpaToiThieu:5,HeSoCoSo:1,HeSoChuyenNganh:1,HeSoNgoaiNgu:1,HeSoUuTien:1,DiemSan:0,TieuChiPhu:'GPA',TaiLieuBatBuoc:'["BANG_DAI_HOC"]'}},201);
 const quota=(await pool.request().query('SELECT MaChiTieu FROM tuyen_sinh.ChiTieu WHERE MaDot='+Number(dot))).recordset[0].MaChiTieu;
 await pool.request().input('Dot',dot).query("UPDATE tuyen_sinh.DotTuyen SET TrangThai='DANG_MO' WHERE MaDot=@Dot AND TrangThai='NHAP'");
 const hash=(await pool.request().query("SELECT MatKhauBam FROM he_thong.TaiKhoanDangNhap WHERE TenDangNhap='demo.test.admin'")).recordset[0].MatKhauBam;
 const actors=[];
 // Synthetic identities and a shared *test-only* password hash; login setup is excluded from latency measurements.
 for(let index=0;index<users;index++){
  const username='load.test.'+String(index).padStart(3,'0'),name='Synthetic load applicant '+index;
  const person=(await pool.request().input('Name',name).input('Email',username+'@example.invalid').query('INSERT danh_muc.Nguoi(HoTen,ThuDienTu) OUTPUT inserted.MaNguoi VALUES(@Name,@Email)')).recordset[0].MaNguoi;
  await pool.request().input('Person',person).input('Username',username).input('Hash',hash).query("INSERT he_thong.TaiKhoanDangNhap(MaNguoi,TenDangNhap,MatKhauBam,VaiTro) VALUES(@Person,@Username,@Hash,'THI_SINH')");
  const profile={HoTen:name,NgaySinh:'2000-01-01',SoGiayTo:String(590000000000+index),DienThoai:'0900000000',TruongCapBang:'Synthetic University',NganhTotNghiep:'IT',XepLoai:'GIOI',Gpa:8,ThangGpa:10,NoiCongTac:'',DoiTuongUuTien:'',TenChungChi:'IELTS',DiemNgoaiNgu:6.5,NgayCapChungChi:'2026-01-01',TenDeCuong:''};
  const id=Number((await pool.request().input('Code','LOAD-'+index).input('Person',person).input('Quota',quota).input('Profile',vault.encode(profile,'admission-profile:'+person)).input('Identity',vault.identity(profile.SoGiayTo)).query("INSERT tuyen_sinh.HoSo(SoHoSo,MaNguoi,MaChiTieu,HoSoMaHoa,MaGiayToBam) OUTPUT inserted.MaHoSo VALUES(@Code,@Person,@Quota,@Profile,@Identity)")).recordset[0].MaHoSo);
  const session=await call('/auth/login',{username,password},201,'');actors.push({id,name,token:session.accessToken});
 }
 const snapshot=async()=>crypto.createHash('sha256').update(JSON.stringify((await pool.request().query(`SELECT MaHoSo,MaNguoi,MaChiTieu,HoSoMaHoa,TrangThai FROM tuyen_sinh.HoSo ORDER BY MaHoSo;SELECT MaGiaoDich,SoTien,TrangThai FROM tuyen_sinh.GiaoDich ORDER BY MaGiaoDich;SELECT MaHocVien,MaSoHocVien FROM hoc_thuat.HocVien ORDER BY MaHocVien;`)).recordsets)).digest('hex');
 const before=await snapshot(),dataSize=(await pool.request().query('SELECT(SELECT COUNT(*) FROM tuyen_sinh.HoSo) AS Applications,(SELECT COUNT(*) FROM tuyen_sinh.GiaoDich) AS Payments,(SELECT COUNT(*) FROM hoc_thuat.HocVien) AS Students')).recordset[0];
 const samples=[],errors=[],counts={},statuses={},userRequests=Array(users).fill(0);let inFlight=0,peak=0;
 const started=performance.now(),until=started+durationSeconds*1000;
 await Promise.all(actors.map(async(actor,index)=>{
  let iteration=0;
  while(performance.now()<until){
   const scenario=iteration++%3,route=scenario===0?'/public/admission-options':scenario===1?'/my/admissions':'/my/admissions/'+actor.id;
   const label=['public-options','own-application-list','own-application-detail'][scenario],at=performance.now();inFlight++;peak=Math.max(peak,inFlight);
   try{
    const response=await fetch(base+route,{headers:{Authorization:'Bearer '+actor.token},signal:AbortSignal.timeout(15000)}),body=await response.json();
    statuses[response.status]=(statuses[response.status]??0)+1;
    assert.equal(response.status,200,'Unexpected response status');
    if(scenario===2){assert.equal(Number(body.MaHoSo),actor.id);assert.equal(body.profile.HoTen,actor.name);}
    else {assert.ok(Array.isArray(body));if(scenario===1)assert.ok(body.every(h=>Number(h.MaHoSo)===actor.id),'Another applicant was exposed');}
   }catch(error){if(errors.length<20)errors.push({scenario:label,error:error.message});counts.failed=(counts.failed??0)+1;}
   finally{inFlight--;samples.push({scenario:label,ms:performance.now()-at});userRequests[index]++;}
   await pause(100);
  }
 }));
 const elapsedMs=performance.now()-started,unchanged=before===await snapshot(),latencies=samples.map(s=>s.ms).sort((a,b)=>a-b),round=n=>Math.round(n*100)/100;
 const perScenario=Object.fromEntries(['public-options','own-application-list','own-application-detail'].map(label=>{const values=samples.filter(s=>s.scenario===label).map(s=>s.ms).sort((a,b)=>a-b);return[label,{requests:values.length,p50Ms:round(percentile(values,.5)),p95Ms:round(percentile(values,.95)),maxMs:round(values.at(-1)??0)}];}));
 const report={passed:!counts.failed&&unchanged&&peak===users&&userRequests.every(n=>n>=3),finishedAt:new Date().toISOString(),scope:'Local API read workload only; not browser, upload/OCR, concurrent login or production capacity certification',virtualUsers:users,distinctAuthenticatedApplicants:actors.length,peakInFlightRequests:peak,configuredDurationSeconds:durationSeconds,elapsedSeconds:round(elapsedMs/1000),thinkTimeMs:100,loginSetupExcluded:true,requests:samples.length,failedRequests:counts.failed??0,statuses,requestsPerSecond:round(samples.length/(elapsedMs/1000)),latency:{p50Ms:round(percentile(latencies,.5)),p95Ms:round(percentile(latencies,.95)),p99Ms:round(percentile(latencies,.99)),maxMs:round(latencies.at(-1)??0)},perScenario,businessDataUnchanged:unchanged,dataSize,environment:{node:process.version,platform:process.platform,architecture:process.arch,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalMemoryGiB:round(os.totalmem()/1024**3)},sampleErrors:errors};
 await fs.writeFile(path.resolve(__dirname,'../../../05_Testing/Tai_50_NguoiDung.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`LOAD 50: ${report.requests} requests, ${report.failedRequests} failed, p95 ${report.latency.p95Ms} ms, ${report.elapsedSeconds} s, unchanged=${unchanged}`);
 assert.ok(report.passed,'50-user API load check failed; see 05_Testing/Tai_50_NguoiDung.json');
 ok?.('50 distinct applicants run concurrent API reads with isolated profiles, zero errors and unchanged business data; latency and machine metrics recorded');
 return report;
}
module.exports=async args=>{
 const file=path.resolve(__dirname,'../../../05_Testing/Tai_50_NguoiDung.json'),startedAt=new Date().toISOString();
 await fs.writeFile(file,JSON.stringify({passed:false,status:'running',startedAt,virtualUsers:50},null,2)+'\n');
 try{return await run(args);}catch(error){let report;try{report=JSON.parse(await fs.readFile(file,'utf8'));}catch{}if(!report?.finishedAt)await fs.writeFile(file,JSON.stringify({passed:false,status:'failed',startedAt,finishedAt:new Date().toISOString(),virtualUsers:50,error:error.message},null,2)+'\n');throw error;}
};
