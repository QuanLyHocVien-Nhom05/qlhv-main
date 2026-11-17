const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async({call,pool,browser,password,base,token,ok})=>{
 const create=(key,values)=>call('/management/'+key,{values},201),action=(key,id,verb,values)=>call(`/management/${key}/${id}/actions/${verb}`,{values},201);
 const iso=days=>new Date(Date.now()+days*86400000).toISOString();
 await create('admission-batches',{KyHieu:'QA_ORG',TenDot:'Exam organization fixture',MoHoSo:iso(-2),DongHoSo:iso(1),HanThamDinh:iso(2),HanBoSung:iso(2),NgayThi:iso(5),NgayCongBo:iso(8),HanPhucKhao:iso(9),HanNhapHoc:iso(12)});
 const dot=(await pool.request().query("SELECT MaDot FROM tuyen_sinh.DotTuyen WHERE KyHieu='QA_ORG'")).recordset[0].MaDot;
 const source=(await pool.request().query('SELECT TOP(1) * FROM tuyen_sinh.ChiTieu ORDER BY MaChiTieu')).recordset[0];
 const meta=(await call('/management/metadata')).find(r=>r.key==='admission-quotas'),values=Object.fromEntries(meta.fields.map(f=>[f.key,source[f.key]]));values.MaDot=dot;values.SoLuong=3;values.PhuongThuc='THI_TUYEN';values.TrinhDo='THAC_SI';values.TaiLieuBatBuoc='["BANG_DAI_HOC"]';
 await create('admission-quotas',values);const quota=(await pool.request().query('SELECT MaChiTieu FROM tuyen_sinh.ChiTieu WHERE MaDot='+dot)).recordset[0].MaChiTieu;
 // Reuse three encrypted test profiles with their original owner/context; no production data is touched.
 await pool.request().query(`INSERT tuyen_sinh.HoSo(SoHoSo,MaNguoi,MaChiTieu,HoSoMaHoa,MaGiayToBam,TrangThai) SELECT TOP(3) CONCAT('QA_ORG_',MaNguoi),MaNguoi,${quota},HoSoMaHoa,MaGiayToBam,'DU_DIEU_KIEN' FROM(SELECT *,ROW_NUMBER() OVER(PARTITION BY MaNguoi ORDER BY MaHoSo) AS rn FROM tuyen_sinh.HoSo) p WHERE rn=1 ORDER BY MaNguoi`);
 assert.equal((await pool.request().query('SELECT COUNT(*) AS N FROM tuyen_sinh.HoSo WHERE MaChiTieu='+quota)).recordset[0].N,3);
 let org=await call(`/admin/admissions/batches/${dot}/exam-organization`);
 await call(`/admin/admissions/batches/${dot}/exam-settings`,{MauSoBaoDanh:'{DOT}-{BAD}-{SO}',DoDaiSoBaoDanh:5,Version:org.batch.Version},400);
 await call(`/admin/admissions/batches/${dot}/exam-settings`,{MauSoBaoDanh:'{DOT}-{NAM}-{SO}',DoDaiSoBaoDanh:5,Version:org.batch.Version},201);
 const staff=await call('/management/options/staff'),chair=Number(staff[0].Id),examiner=Number(staff.find(s=>Number(s.Id)!==chair).Id);
 await create('admission-rooms',{KyHieu:'QA_ORG_BIG',TenPhong:'Organization large room',SucChua:2});await create('admission-rooms',{KyHieu:'QA_ORG_SMALL',TenPhong:'Organization small room',SucChua:1});
 const rooms=(await call('/management/admission-rooms?limit=100')).data,big=rooms.find(r=>r.KyHieu==='QA_ORG_BIG').MaPhong,small=rooms.find(r=>r.KyHieu==='QA_ORG_SMALL').MaPhong;
 for(const [name,room,start] of [['Organization first',big,5],['Organization conflict',small,5],['Organization second',small,6]]){
  await create('admission-exams',{MaDot:dot,MaPhong:room,MaChiTieu:quota,TenCa:name,BatDau:iso(start),KetThuc:iso(start+.01),HinhThuc:'THI_VIET',ThanhPhan:'TONG_HOP'});
  const ca=(await pool.request().query(`SELECT MaCa FROM tuyen_sinh.CaThi WHERE MaDot=${dot} AND TenCa=N'${name}'`)).recordset[0].MaCa;
  await create('admission-examiners',{MaCa:Number(ca),MaCanBo:chair,VaiTro:'COI_THI'});await create('admission-examiners',{MaCa:Number(ca),MaCanBo:examiner,VaiTro:'CHAM_THI'});
  await call(`/admin/admissions/exams/${ca}/publish`,{},409);
  await require('./exam-council-fixture.cjs')({call,pool,ca});
 }
 org=await call(`/admin/admissions/batches/${dot}/exam-organization`);const first=org.exams.find(c=>c.TenCa==='Organization first'),second=org.exams.find(c=>c.TenCa==='Organization second');
 const h=org.councils.find(h=>h.MaHoiDong===first.MaHoiDong);
 await call(`/management/admission-council-members/${h.members[0].MaThanhVien}/actions/remove`,{values:{}},409);
 await call(`/management/admission-councils/${h.MaHoiDong}/actions/approve`,{values:{Version:h.Version}},409);
 const preview=await call(`/admin/admissions/batches/${dot}/allocate-exams`,{Preview:true},201);assert.equal(preview.unassigned.length,0);assert.equal(preview.exams.reduce((n,c)=>n+c.DaPhan,0),3);assert.ok(preview.exams.some(c=>/trùng/.test(c.LyDo)));
 assert.equal((await pool.request().query(`SELECT COUNT(*) AS N FROM tuyen_sinh.PhanPhong p JOIN tuyen_sinh.CaThi c ON c.MaCa=p.MaCa WHERE c.MaDot=${dot}`)).recordset[0].N,0);
 const applied=await call(`/admin/admissions/batches/${dot}/allocate-exams`,{Preview:false},201);assert.equal(applied.unassigned.length,0);
 const repeated=await call(`/admin/admissions/batches/${dot}/allocate-exams`,{Preview:false},201);assert.equal(repeated.exams.reduce((n,c)=>n+c.DaPhan,0),0);
 const numbers=(await pool.request().query(`SELECT p.SoBaoDanh FROM tuyen_sinh.PhanPhong p JOIN tuyen_sinh.CaThi c ON c.MaCa=p.MaCa WHERE c.MaDot=${dot}`)).recordset;assert.equal(numbers.length,3);assert.equal(new Set(numbers.map(n=>n.SoBaoDanh)).size,3);for(const r of numbers)assert.match(r.SoBaoDanh,/^QA_ORG-\d{4}-\d{5,}$/);
 org=await call(`/admin/admissions/batches/${dot}/exam-organization`);await call(`/admin/admissions/batches/${dot}/exam-settings`,{MauSoBaoDanh:'{DOT}-{SO}',DoDaiSoBaoDanh:7,Version:org.batch.Version},409);
 await call(`/admin/admissions/exams/${first.MaCa}/publish`,{},201);await call(`/admin/admissions/exams/${second.MaCa}/publish`,{},201);
 const r=await fetch(base+`/admin/admissions/batches/${dot}/attendance.pdf`,{headers:{Authorization:'Bearer '+token}});assert.equal(r.status,200);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal((await require('pdf-lib').PDFDocument.load(bytes)).getPageCount(),2);
 ok('Approved councils gate publication; batch preview rolls back, allocation respects rooms/staff/capacity, reuses SBD and repeats without duplicates; attendance PDF separates rooms');
 const {expect}=require('@playwright/test'),page=await browser.newPage();await page.goto('http://localhost:3100/quan-tri');await page.getByLabel('Tên đăng nhập',{exact:true}).fill('demo.test.admin');await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByRole('navigation',{name:'Chức năng chính'}).getByRole('button',{name:'Tuyển sinh',exact:true}).click();await page.getByRole('button',{name:'Tổ chức thi / chấm điểm',exact:true}).click();
 await page.getByLabel('Đợt tổ chức thi',{exact:true}).selectOption(String(dot));const panel=page.getByRole('region',{name:'Tổ chức thi toàn đợt'});await expect(panel.getByText('Mẫu hiện tại:',{exact:false})).toHaveCount(1);await panel.locator('summary').filter({hasText:'Thành viên và duyệt hội đồng'}).click();await expect(panel.getByText(h.TenHoiDong,{exact:false}).first()).toBeVisible();await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.resolve(__dirname,'../../../05_Testing/Frontend/hoi-dong-to-chuc-thi-mobile.png'),fullPage:true});await page.close();
 ok('Council and whole-batch organization UI renders approved membership and fits mobile');
};
