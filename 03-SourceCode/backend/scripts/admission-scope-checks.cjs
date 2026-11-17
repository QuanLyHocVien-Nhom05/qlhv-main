const assert=require('node:assert/strict');
const {processBatchSchedule}=require('../dist/modules/admissions/infrastructure/admission-schedule');
module.exports=async({call,pool,browser,page,nav,unit,ok})=>{
 const create=(key,values)=>call('/management/'+key,{values},201);
 const action=(key,id,name,values={})=>call(`/management/${key}/${id}/actions/${name}`,{values},201);
 const rows=async key=>(await call('/management/'+key+'?limit=100')).data;
 for(const key of ['topics','defenses','committee','grad-rules','graduation','subscriptions','settings']){
  await call('/management/'+key,undefined,404);
  await call('/management/'+key,{values:{}},404);
  await call('/management/'+key+'/1/actions/edit',{values:{}},404);
 }
 for(const route of ['/reports/students','/reports/students.xlsx'])await call(route,undefined,404);
 await call('/public/subscribe',{},404,'');
 await page.goto('http://localhost:3100/nguoi-huong-dan');
 assert.equal((await fetch('http://localhost:3100/nghien-cuu')).status,404);
 const removedLabels=['Đề tài và GVHD','Hội đồng bảo vệ','Xét tốt nghiệp','Cấu hình tham số'];
 await page.goto('http://localhost:3100/quan-tri');
 for(const label of removedLabels)assert.equal(await nav.getByRole('button',{name:label,exact:true}).count(),0);
 ok('Out-of-scope web pages, APIs and direct management writes are unavailable');

 await create('majors',{KyHieu:'SCOPE_PARENT',TenNganh:'Ngành kiểm thử',MaDonVi:unit.Id});
 let parent=(await rows('majors')).find(r=>r.KyHieu==='SCOPE_PARENT');
 await create('majors',{KyHieu:'SCOPE_CHILD',TenNganh:'Chuyên ngành kiểm thử',MaDonVi:unit.Id,MaNganhCha:parent.MaNganh});
 const child=(await rows('majors')).find(r=>r.KyHieu==='SCOPE_CHILD');
 assert.equal(child.MaNganhCha,parent.MaNganh);assert.equal(child.TenNganhCha,parent.TenNganh);
 await call(`/management/majors/${parent.MaNganh}/actions/edit`,{values:{Revision:parent.Revision,KyHieu:parent.KyHieu,TenNganh:parent.TenNganh,MaDonVi:unit.Id,DangHoatDong:true,MaNganhCha:child.MaNganh}},409);
 await call(`/management/majors/${child.MaNganh}/actions/edit`,{values:{Revision:child.Revision,KyHieu:child.KyHieu,TenNganh:child.TenNganh,MaDonVi:unit.Id,DangHoatDong:true,MaNganhCha:child.MaNganh}},409);
 ok('Major hierarchy stores a specialization and rejects self-parenting and ancestor cycles');

 const iso=days=>new Date(Date.now()+days*86400000).toISOString();
 await create('admission-batches',{KyHieu:'SCOPE_SCHEDULE',TenDot:'Đợt mở theo lịch',MoHoSo:iso(1),DongHoSo:iso(2),HanThamDinh:iso(3),HanBoSung:iso(3),NgayThi:iso(4),NgayCongBo:iso(5),HanPhucKhao:iso(6),HanNhapHoc:iso(7)});
 const batch=(await rows('admission-batches')).find(r=>r.KyHieu==='SCOPE_SCHEDULE');
 const state=async()=>(await pool.request().input('Id',batch.MaDot).query('SELECT TrangThai,TuDongTheoLich FROM tuyen_sinh.DotTuyen WHERE MaDot=@Id')).recordset[0];
 await call(`/management/admission-batches/${batch.MaDot}/actions/schedule`,{values:{}},409);
 await pool.request().input('Id',batch.MaDot).input('Major',parent.MaNganh).query(`INSERT tuyen_sinh.ChiTieu(MaDot,MaNganh,TrinhDo,PhuongThuc,SoLuong,LePhi,PhiNhapHoc,GpaToiThieu,HeSoCoSo,HeSoChuyenNganh,HeSoNgoaiNgu,HeSoUuTien,DiemSan,TieuChiPhu,TaiLieuBatBuoc,QuyTacDaXacNhan,DuKien)
 VALUES(@Id,@Major,'THAC_SI','XET_TUYEN',5,0,0,5,1,1,1,1,0,'GPA',N'["BANG_DAI_HOC"]',1,0)`);
 await call(`/management/admission-batches/${batch.MaDot}/actions/open`,{values:{}},409);
 await action('admission-batches',batch.MaDot,'schedule');
 await action('admission-batches',batch.MaDot,'cancel-schedule');
 assert.equal((await state()).TuDongTheoLich,false);
 await action('admission-batches',batch.MaDot,'schedule');
 await pool.request().query(processBatchSchedule);assert.equal((await state()).TrangThai,'NHAP');
 await pool.request().input('Id',batch.MaDot).query("UPDATE tuyen_sinh.ChiTieu SET QuyTacDaXacNhan=0 WHERE MaDot=@Id;UPDATE tuyen_sinh.DotTuyen SET MoHoSo=DATEADD(minute,-2,SYSUTCDATETIME()),DongHoSo=DATEADD(minute,2,SYSUTCDATETIME()) WHERE MaDot=@Id");
 await pool.request().query(processBatchSchedule);assert.equal((await state()).TrangThai,'NHAP');
 await pool.request().input('Id',batch.MaDot).query('UPDATE tuyen_sinh.ChiTieu SET QuyTacDaXacNhan=1 WHERE MaDot=@Id');
 await pool.request().query(processBatchSchedule);assert.equal((await state()).TrangThai,'DANG_MO');
 await pool.request().input('Id',batch.MaDot).query('UPDATE tuyen_sinh.DotTuyen SET DongHoSo=DATEADD(minute,-1,SYSUTCDATETIME()) WHERE MaDot=@Id');
 await pool.request().query(processBatchSchedule);assert.equal((await state()).TrangThai,'DA_DONG');
 await pool.request().query(processBatchSchedule);
 const audit=(await pool.request().input('Id',batch.MaDot).query("SELECT HanhDong,MaNguoiThucHien FROM he_thong.NhatKyThayDoi WHERE TenDoiTuong='DotTuyen' AND MaDoiTuong=@Id AND HanhDong IN('TU_DONG_MO_DOT','TU_DONG_DONG_DOT')")).recordset;
 assert.equal(audit.length,2);assert.ok(audit.every(a=>a.MaNguoiThucHien));
 ok('Scheduled batches open/close only when ready and in time; canceled schedules and repeated jobs preserve state/audit integrity');
};
