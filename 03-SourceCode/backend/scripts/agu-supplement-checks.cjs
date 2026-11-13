const assert=require('node:assert/strict');
module.exports=async({pool,call,browser,ok})=>{
 const {dataset,augment}=require('./augment-agu.cjs'),data=dataset();
 const actor=(await pool.request().query("SELECT TOP(1) MaNguoi FROM he_thong.TaiKhoanDangNhap WHERE VaiTro='ADMIN' AND DangHoatDong=1 AND DaXoa=0 ORDER BY MaTaiKhoan")).recordset[0].MaNguoi;
 async function snapshot(){return(await pool.request().query(`SELECT MaTaiKhoan,VaiTro,DangHoatDong,DaXoa,PhienBanMatKhau,CONVERT(varchar(64),HASHBYTES('SHA2_256',MatKhauBam),2) AS PasswordFingerprint FROM he_thong.TaiKhoanDangNhap ORDER BY MaTaiKhoan;SELECT (SELECT COUNT(*) FROM hoc_thuat.ChuongTrinh) AS Programs,(SELECT COUNT(*) FROM hoc_thuat.PhienBanChuongTrinh) AS Versions,(SELECT COUNT(*) FROM hoc_thuat.HocPhan) AS Courses,(SELECT COUNT(*) FROM hoc_thuat.HocVien) AS Students,(SELECT COUNT(*) FROM tuyen_sinh.HoSo) AS Applications,(SELECT COUNT(*) FROM tuyen_sinh.GiaoDich) AS Payments;`)).recordsets;}
 const before=await snapshot();const initialDocs=(await call('/public/documents',undefined,200,'')).length;
 const conflict=JSON.parse(JSON.stringify(data));conflict.documents[3].code='1362/TB-ĐHAG';await assert.rejects(()=>augment(pool,conflict,actor),/Trùng mã văn bản khác nguồn/);
 assert.equal((await call('/public/documents',undefined,200,'')).length,initialDocs);
 const imported=await augment(pool,data,actor);assert.equal(imported.documentsAdded,5);assert.equal(imported.quotasAdded,6);assert.equal(imported.announcementsAdded,1);assert.deepEqual(await snapshot(),before);
 const repeated=await augment(pool,data,actor);assert.equal(repeated.documentsAdded+repeated.announcementsAdded+repeated.quotasAdded,0);assert.equal(repeated.documentsSkipped,5);assert.equal(repeated.quotasSkipped,6);assert.deepEqual(await snapshot(),before);
 const documents=await call('/public/documents',undefined,200,'');assert.equal(documents.length,initialDocs+5);
 const sources=documents.filter(d=>d.KieuKiemChung==='CHI_MUC_TIM_KIEM');assert.equal(sources.length,5);assert.ok(sources.every(d=>d.NguonUrl.startsWith('https://pgd.agu.edu.vn/storage/')&&d.GhiChuNguon&&d.NgayKiemChung));
 const disputed=sources.find(d=>d.SoVanBan==='PGD-TS-2021');assert.equal(disputed.MaDinhDanhNoiBo,true);assert.match(disputed.GhiChuNguon,/898.*838/);
 const unknown=sources.find(d=>d.SoVanBan==='PGD-QC-TS-DHQG');assert.equal(unknown.NgayBanHanh,null);
 const archive=await call('/public/admission-announcements',undefined,200,'');const annual=archive.filter(a=>a.SoVanBan==='1103/TB-ĐHAG');assert.equal(annual.length,6);assert.equal(annual.reduce((n,r)=>n+r.SoLuong,0),175);assert.ok(annual.every(r=>r.PhuongThuc==='CHUNG'&&r.TrangThai==='DA_DONG'&&r.DongHoSo===null&&r.NgayCongBo===null&&r.PhiDangKy===null&&r.PhiXetTuyen===null));
 assert.equal((await call('/public/admission-options',undefined,200,'')).length,0);
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://localhost:3100/thong-tin');await require('@playwright/test').expect(page.getByRole('heading',{name:'Quy chế đào tạo trình độ thạc sĩ năm 2014',exact:true})).toBeVisible();await require('@playwright/test').expect(page.locator('main')).toContainText('Mã quản lý: PGD-TS-2021');await require('@playwright/test').expect(page.locator('main')).toContainText('chưa tải lại được PDF nguồn');
 await page.getByRole('link',{name:'Mở văn bản ↗',exact:true}).first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:require('node:path').resolve(__dirname,'../../../05_Testing/Frontend/bo-sung-van-ban-agu-mobile.png'),fullPage:true});await page.close();
 ok('AGU append imports five cited documents and six annual historical quotas, rolls back conflicting sources, is repeatable and preserves accounts/programs/profiles');
};
