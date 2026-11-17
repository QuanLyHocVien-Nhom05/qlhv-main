const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async({call,pool,browser,password,base,token,ok})=>{
 const {DataProtection}=require('../dist/shared/security/data-protection'),{ConfigService}=require('@nestjs/config');
 const vault=new DataProtection(new ConfigService({DATA_ENCRYPTION_KEY:process.env.DATA_ENCRYPTION_KEY}));
 const dot=(await pool.request().query("SELECT MaDot FROM tuyen_sinh.DotTuyen WHERE KyHieu='QA_ORG'")).recordset[0].MaDot;
 const q=(await pool.request().query(`SELECT MaChiTieu FROM tuyen_sinh.ChiTieu WHERE MaDot=${dot}`)).recordset[0].MaChiTieu;
 const owner=(await call('/admin/accounts?search=approval.1')).data[0],actor=(await call('/auth/login',{username:'approval.1',password},201,'')).accessToken;
 const profiles=(await pool.request().query(`SELECT MaHoSo FROM tuyen_sinh.HoSo WHERE MaChiTieu=${q} ORDER BY MaHoSo`)).recordset.map(r=>Number(r.MaHoSo));assert.equal(profiles.length,3);
 // Timeline manipulation is restricted to this isolated fixture database.
 await pool.request().query(`UPDATE tuyen_sinh.DotTuyen SET MoHoSo=DATEADD(day,-10,SYSUTCDATETIME()),DongHoSo=DATEADD(day,-9,SYSUTCDATETIME()),HanThamDinh=DATEADD(day,-8,SYSUTCDATETIME()),HanBoSung=DATEADD(day,-8,SYSUTCDATETIME()),NgayThi=DATEADD(day,-7,SYSUTCDATETIME()),NgayCongBo=DATEADD(day,-6,SYSUTCDATETIME()),HanPhucKhao=DATEADD(day,-1,SYSUTCDATETIME()),CongBoDiem=1,TrangThai='DA_DONG' WHERE MaDot=${dot};UPDATE tuyen_sinh.ChiTieu SET SoLuong=1,DiemSan=0 WHERE MaChiTieu=${q};`);
 for(const id of profiles)await pool.request().input('Id',id).input('Score',vault.encode({CoSo:8,ChuyenNganh:8,NgoaiNgu:6,UuTien:0,Tong:22,Gpa:8},'admission-scores:'+id)).input('Actor',Number(owner.MaNguoi)).query('INSERT tuyen_sinh.KetQua(MaHoSo,DiemMaHoa,MaNguoiNhap) VALUES(@Id,@Score,@Actor)');
 await call(`/admin/admissions/batches/${dot}/approve`,{GhiChu:'Cannot publish before ranking'},409,actor);
 await call(`/admin/admissions/batches/${dot}/rank`,{},400);
 await call(`/admin/admissions/quotas/${q}/tie-decision`,{ThuTuHoSo:profiles.slice(0,2),LyDo:'Incomplete boundary group'},400,actor);
 // Old level-1 permission alone must never authorize the new workflow.
 await pool.request().query(`DELETE tuyen_sinh.QuyenDuyet WHERE MaNguoi=${Number(owner.MaNguoi)} AND CapDuyet=0;INSERT tuyen_sinh.QuyenDuyet(MaNguoi,CapDuyet) VALUES(${Number(owner.MaNguoi)},1);`);
 await call(`/admin/admissions/quotas/${q}/tie-decision`,{ThuTuHoSo:profiles,LyDo:'Old permission must not apply'},403,actor);
 await call(`/admin/admissions/batches/${dot}/approve`,{GhiChu:'Old permission must not approve'},403,actor);
 await call('/management/admission-approval-rights',{values:{MaNguoi:Number(owner.MaNguoi)}},201);
 await call(`/admin/admissions/quotas/${q}/tie-decision`,{ThuTuHoSo:[...profiles].reverse(),LyDo:'Documented tie decision for course project'},201,actor);
 await call(`/admin/admissions/batches/${dot}/rank`,{},201);
 const selection=await call(`/admin/admissions/batches/${dot}/selection`);assert.equal(selection.candidates.filter(c=>c.DuKienTrungTuyen).length,1);assert.equal(Number(selection.candidates.find(c=>c.DuKienTrungTuyen).MaHoSo),profiles[2]);
 const {expect}=require('@playwright/test'),page=await browser.newPage();await page.goto('http://localhost:3100/quan-tri');await page.getByLabel('Tên đăng nhập',{exact:true}).fill('approval.1');await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByRole('navigation',{name:'Chức năng chính'}).getByRole('button',{name:'Tuyển sinh',exact:true}).click();await page.getByRole('button',{name:'Xét tuyển và phê duyệt',exact:true}).click();await page.getByLabel('Đợt tuyển sinh',{exact:false}).selectOption(String(dot));await expect(page.getByRole('button',{name:'Phê duyệt và công bố trúng tuyển',exact:true})).toBeVisible();assert.equal(await page.getByLabel('Cấp phê duyệt',{exact:true}).count(),0);
 // Tampering with the draft list must be caught even after ranking.
 await pool.request().query(`UPDATE tuyen_sinh.KetQua SET DuKienTrungTuyen=1 WHERE MaHoSo=${profiles[0]}`);await call(`/admin/admissions/batches/${dot}/approve`,{GhiChu:'Reject tampered draft list'},400,actor);await pool.request().query(`UPDATE tuyen_sinh.KetQua SET DuKienTrungTuyen=0 WHERE MaHoSo=${profiles[0]}`);
 // Restore a fresh decision snapshot after the intentional rowversion changes.
 await pool.request().query(`UPDATE tuyen_sinh.DotTuyen SET TrangThai='DA_DONG' WHERE MaDot=${dot}`);await call(`/admin/admissions/quotas/${q}/tie-decision`,{ThuTuHoSo:[...profiles].reverse(),LyDo:'Reconfirm after draft correction'},201,actor);await call(`/admin/admissions/batches/${dot}/rank`,{},201);
 const send=()=>fetch(base+`/admin/admissions/batches/${dot}/approve`,{method:'POST',headers:{Authorization:'Bearer '+actor,'Content-Type':'application/json'},body:JSON.stringify({GhiChu:'Single final approval with concurrency protection'})});
 const results=await Promise.all([send(),send()]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);for(const response of results)await response.arrayBuffer();
 const audit=(await pool.request().query(`SELECT * FROM tuyen_sinh.TrinhDuyet WHERE MaDot=${dot} AND CapDuyet=0`)).recordset;assert.equal(audit.length,1);assert.equal(Number(audit[0].MaNguoi),Number(owner.MaNguoi));assert.ok(audit[0].DiaChiIP);
 const flags=(await pool.request().query(`SELECT TrangThai,COUNT(*) AS N FROM tuyen_sinh.HoSo WHERE MaChiTieu=${q} GROUP BY TrangThai`)).recordset;assert.equal(flags.find(r=>r.TrangThai==='TRUNG_TUYEN').N,1);
 await page.reload();await expect(page.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();await page.getByRole('navigation',{name:'Chức năng chính'}).getByRole('button',{name:'Tuyển sinh',exact:true}).click();await page.getByRole('button',{name:'Xét tuyển và phê duyệt',exact:true}).click();await page.getByLabel('Đợt tuyển sinh',{exact:false}).selectOption(String(dot));await expect(page.getByText('Kết quả đã công bố và khóa.',{exact:true})).toBeVisible();await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.resolve(__dirname,'../../../05_Testing/Frontend/phe-duyet-mot-cap-mobile.png'),fullPage:true});await page.close();
 ok('Single approval requires explicit new permission, records tie decisions, rejects stale/tampered lists and duplicate concurrent approvals, publishes once with audit/IP and locks results in mobile UI');
};
