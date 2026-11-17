const assert=require('node:assert/strict');
module.exports=async({pool,call,password,base,ok})=>{
 assert.match((await pool.request().query('SELECT DB_NAME() AS Name')).recordset[0].Name,/^QLCTDT_Test_[a-f0-9]{12}$/,'Only run these fixtures in an isolated test database');
 const create=(key,values)=>call('/management/'+key,{values},201);
 const iso=days=>new Date(Date.now()+days*86400000).toISOString();
 const id=async(table,column,value)=>(await pool.request().input('Value',value).query(`SELECT * FROM ${table} WHERE ${column}=@Value`)).recordset[0];
 const units=[];for(const code of ['PUB_A','PUB_B']){await create('units',{KyHieu:code,TenDonVi:code});const u=await id('danh_muc.DonVi','KyHieu',code);await create('majors',{KyHieu:code,TenNganh:code,MaDonVi:Number(u.MaDonVi)});units.push({unit:Number(u.MaDonVi),major:Number((await id('danh_muc.Nganh','KyHieu',code)).MaNganh)});}
 const actors={};for(const [name,role,unit]of [['officer','CAN_BO',0],['other','CAN_BO',1],['leader','LANH_DAO',0],['teacher','GIANG_VIEN',0],['candidate','THI_SINH',0],['student','USER',0]]){
  const username='pub.'+name;await call('/admin/accounts',{TenDangNhap:username,HoTen:username,ThuDienTu:username+'@example.invalid',VaiTro:role,MatKhau:password,XacNhanMatKhau:password,...(['CAN_BO','LANH_DAO','GIANG_VIEN'].includes(role)?{MaDonVi:units[unit].unit,HocVi:'TIEN_SI'}:{})},201);
  const account=(await call('/admin/accounts?search='+username)).data.find(a=>a.TenDangNhap===username);actors[name]={person:Number(account.MaNguoi),token:(await call('/auth/login',{username,password},201,'')).accessToken};
 }
 const batches={};for(const [code,scope]of [['PUB_OWN',[0]],['PUB_OTHER',[1]],['PUB_MIXED',[0,1]],['PUB_MISSING',[0]],['PUB_LOCKED',[0]],['PUB_ADMIN',[1]],['PUB_DRAFT',[0]]]){
  await create('admission-batches',{KyHieu:code,TenDot:code,MoHoSo:iso(-1),DongHoSo:iso(3),HanThamDinh:iso(4),HanBoSung:iso(4),NgayThi:iso(5),NgayCongBo:iso(6),HanPhucKhao:iso(7),HanNhapHoc:iso(9)});
  const batch=Number((await id('tuyen_sinh.DotTuyen','KyHieu',code)).MaDot);
  for(const unit of scope)await create('admission-quotas',{MaDot:batch,MaNganh:units[unit].major,TrinhDo:'THAC_SI',PhuongThuc:'XET_TUYEN',SoLuong:5,LePhi:0,PhiNhapHoc:0,GpaToiThieu:5,HeSoCoSo:1,HeSoChuyenNganh:1,HeSoNgoaiNgu:1,HeSoUuTien:1,DiemSan:15,TieuChiPhu:'GPA',TaiLieuBatBuoc:'["BANG_DAI_HOC"]'});
  if(code!=='PUB_DRAFT')await call(`/management/admission-batches/${batch}/actions/open`,{values:{}},201);batches[code]=batch;
 }
 const publish=(batch,actor,status=201)=>call(`/management/admission-batches/${batch}/actions/publish-scores`,{values:{}},status,actor);
 const metadata=await call('/management/metadata',undefined,200,actors.officer.token);assert.ok(metadata.find(r=>r.key==='admission-batches').actions.some(a=>a.key==='publish-scores'));assert.ok(!metadata.some(r=>r.key==='admission-approval-rights'));
 for(const who of ['leader','teacher','candidate','student'])await publish(batches.PUB_OWN,actors[who].token,403);
 await publish(batches.PUB_OTHER,actors.officer.token,403);await publish(batches.PUB_MIXED,actors.officer.token,403);await publish(batches.PUB_OWN,actors.other.token,403);
 await publish(batches.PUB_DRAFT,actors.officer.token,409);
 const quota=Number((await id('tuyen_sinh.ChiTieu','MaDot',batches.PUB_MISSING)).MaChiTieu);
 const h=(await pool.request().input('Person',actors.candidate.person).input('Quota',quota).query("INSERT tuyen_sinh.HoSo(SoHoSo,MaNguoi,MaChiTieu,HoSoMaHoa,MaGiayToBam,TrangThai) OUTPUT inserted.MaHoSo VALUES('PUB_MISSING',@Person,@Quota,'{}',REPLICATE('e',64),'DU_DIEU_KIEN')")).recordset[0].MaHoSo;
 await call(`/management/admission-batches/${batches.PUB_MISSING}/actions/close`,{values:{}},201);await publish(batches.PUB_MISSING,actors.officer.token,409);
 await pool.request().input('Batch',batches.PUB_LOCKED).query("UPDATE tuyen_sinh.DotTuyen SET TrangThai='CONG_BO',CongBoDiem=1 WHERE MaDot=@Batch");await publish(batches.PUB_LOCKED,actors.officer.token,409);
 const concurrent=()=>fetch(base+'/management/admission-batches/'+batches.PUB_OWN+'/actions/publish-scores',{method:'POST',headers:{Authorization:'Bearer '+actors.officer.token,'Content-Type':'application/json'},body:'{"values":{}}'});
 const responses=await Promise.all([concurrent(),concurrent()]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);for(const response of responses)await response.arrayBuffer();await publish(batches.PUB_OWN,actors.officer.token,409);
 await publish(batches.PUB_ADMIN,undefined);
 const vault=new(require('../dist/shared/security/data-protection').DataProtection)(new(require('@nestjs/config').ConfigService)({DATA_ENCRYPTION_KEY:process.env.DATA_ENCRYPTION_KEY}));
 await pool.request().input('Id',Number(h)).input('Actor',actors.teacher.person).input('Score',vault.encode({CoSo:8,ChuyenNganh:8,NgoaiNgu:8,UuTien:0,Tong:24,Gpa:8},'admission-scores:'+h)).query('INSERT tuyen_sinh.KetQua(MaHoSo,DiemMaHoa,MaNguoiNhap) VALUES(@Id,@Score,@Actor)');
 await publish(batches.PUB_MISSING,actors.officer.token);
 await call(`/admin/admissions/batches/${batches.PUB_OWN}/approve`,{GhiChu:'Publication permission does not grant approval'},403,actors.officer.token);
 await call('/management/admission-approval-rights',{values:{MaNguoi:actors.officer.person}},403,actors.officer.token);
 const audit=(await pool.request().input('Batch',batches.PUB_OWN).query("SELECT * FROM he_thong.NhatKyThayDoi WHERE TenDoiTuong='admission-batches' AND HanhDong='publish-scores' AND MaDoiTuong=@Batch")).recordset;assert.equal(audit.length,1);assert.equal(Number(audit[0].MaNguoiThucHien),actors.officer.person);assert.ok(audit[0].ThoiDiem);
 const flags=(await pool.request().query("SELECT KyHieu,CongBoDiem FROM tuyen_sinh.DotTuyen WHERE KyHieu IN('PUB_OTHER','PUB_MIXED')")).recordset;assert.ok(flags.every(b=>!b.CongBoDiem));
 require('node:fs').writeFileSync(require('node:path').resolve(__dirname,'../../../05_Testing/PhanQuyenCongBoDiem.json'),JSON.stringify({completedAt:new Date().toISOString(),passed:true,isolatedDatabase:true,officerActionVisible:true,otherRolesDenied:true,outsideUnitDenied:true,mixedUnitDenied:true,adminSupported:true,missingScoresBlocked:true,draftAndLockedBlocked:true,closedBatchAllowed:true,concurrentPublicationOnce:true,singleAudit:true,finalApprovalStillRequiresSeparateGrant:true},null,2)+'\n');
 ok('Temporary score publication: officer unit scope, mixed-unit denial, admin support, missing-score/locked/repeat rejection, role metadata, audit and separate final approval');
};
