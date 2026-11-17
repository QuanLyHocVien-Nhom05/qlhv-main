const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({call,pool,browser,password,base,ok})=>{
 assert.match((await pool.request().query('SELECT DB_NAME() AS Name')).recordset[0].Name,/^QLCTDT_Test_[a-f0-9]{12}$/);
 const {expect}=require('@playwright/test'),key='qlhv.access-token',site='http://localhost:3100';
 const unit=Number((await call('/management/options/units'))[0].Id),people={};
 for(const [suffix,role]of [['admin','ADMIN'],['officer','CAN_BO'],['leader','LANH_DAO'],['teacher','GIANG_VIEN'],['student','USER'],['candidate','THI_SINH']]){
  const username='session.'+suffix;await call('/admin/accounts',{TenDangNhap:username,HoTen:'Session '+suffix,ThuDienTu:username+'@example.invalid',VaiTro:role,MatKhau:password,XacNhanMatKhau:password,...(['ADMIN','CAN_BO','LANH_DAO','GIANG_VIEN'].includes(role)?{MaDonVi:unit,HocVi:'TIEN_SI'}:{})},201);
  people[suffix]={username,role};
 }
 async function login(page,name,pw=password){await page.goto(site+'/dang-nhap');await page.getByLabel('Tên đăng nhập',{exact:true}).fill(people[name].username);await page.getByLabel('Mật khẩu',{exact:true}).fill(pw);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('**/'+(name==='candidate'?'tuyen-sinh':name==='student'?'tai-khoan':'quan-tri'));await expect(page.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();}
 const stored=page=>page.evaluate(k=>sessionStorage.getItem(k),key);
 for(const suffix of Object.keys(people)){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(30000);
  await login(page,suffix);const token=await stored(page);assert.ok(token);assert.equal(await page.evaluate(pw=>Object.values(sessionStorage).some(v=>v.includes('MatKhau')||v.includes(pw)),password),false);
  await page.reload();await expect(page.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();assert.equal(await stored(page),token);assert.equal(await page.getByLabel('Tên đăng nhập',{exact:true}).count(),0);
  if(suffix==='officer'){fs.mkdirSync(path.resolve(__dirname,'../../../05_Testing/Frontend'),{recursive:true});await page.locator('.topbar').screenshot({path:path.resolve(__dirname,'../../../05_Testing/Frontend/dang-xuat-can-bo.png')});}
  await page.goto(site+'/');const nav=page.getByRole('navigation',{name:'Điều hướng website'});await expect(nav.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Mở menu',exact:true}).click();await expect(nav.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(suffix==='candidate')await page.screenshot({path:path.resolve(__dirname,'../../../05_Testing/Frontend/dang-xuat-thi-sinh-mobile.png'),fullPage:true});
  await nav.getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible();assert.equal(await stored(page),null);await call('/auth/me',undefined,401,token);
  await page.reload();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible();assert.equal(await stored(page),null);await context.close();
 }
 ok('All six roles retain validated sessions after reload and expose logout on workspace/public/mobile pages; logout clears storage and revokes tokens');

 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(30000);
 await login(page,'officer');let token=await stored(page);
 let account=(await call('/admin/accounts?search=session.officer')).data.find(a=>a.TenDangNhap==='session.officer');
 await call('/admin/accounts/'+account.MaTaiKhoan,{VaiTro:'CAN_BO',DangHoatDong:false,Revision:account.Revision},200,undefined,'PATCH');
 await page.reload();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible();assert.equal(await stored(page),null);await call('/auth/me',undefined,401,token);
 account=(await call('/admin/accounts?search=session.officer&state=locked')).data.find(a=>a.TenDangNhap==='session.officer');await call('/admin/accounts/'+account.MaTaiKhoan,{VaiTro:'CAN_BO',DangHoatDong:true,Revision:account.Revision},200,undefined,'PATCH');
 await login(page,'officer');token=await stored(page);const newPassword=password+'Changed';await call('/auth/change-password',{currentPassword:password,newPassword,confirmPassword:newPassword},200,token);
 await page.reload();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible();assert.equal(await stored(page),null);
 await login(page,'officer',newPassword);account=(await call('/admin/accounts?search=session.officer')).data.find(a=>a.TenDangNhap==='session.officer');await call('/admin/accounts/'+account.MaTaiKhoan,{VaiTro:'GIANG_VIEN',DangHoatDong:true,Revision:account.Revision},200,undefined,'PATCH');
 await page.reload();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible();assert.equal(await stored(page),null);
 await login(page,'leader');token=await stored(page);
 await page.route('**/api/auth/me',route=>route.fulfill({status:503,contentType:'application/json',body:'{"message":"Temporarily unavailable"}'}));await page.reload();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible();assert.equal(await stored(page),token);await page.unroute('**/api/auth/me');await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();assert.equal(await stored(page),token);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('qlhv-session-expired',{detail:{token:'an-old-request-token'}})));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await stored(page),token);await expect(page.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();
 const parts=token.split('.'),claims=JSON.parse(Buffer.from(parts[1],'base64url').toString());claims.roles=['ACADEMIC_ADMIN'];const forged=parts[0]+'.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.'+parts[2];
 await page.evaluate(({key,token})=>sessionStorage.setItem(key,token),{key,token:forged});await page.reload();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible();assert.equal(await stored(page),null);
 await login(page,'leader');token=await stored(page);const original=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());const short=await new(require('@nestjs/jwt').JwtService)().signAsync({...original,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+5},{secret:process.env.JWT_SECRET,algorithm:'HS256'});
 await page.evaluate(({key,token})=>sessionStorage.setItem(key,token),{key,token:short});await page.reload();await expect(page.getByRole('button',{name:'Đăng xuất',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Đăng nhập hệ thống',exact:true})).toBeVisible({timeout:10000});assert.equal(await stored(page),null);
 await context.close();
 const report={completedAt:new Date().toISOString(),passed:true,isolatedDatabase:true,rolesVerified:6,reloadPersists:true,logoutClearsAndRevokes:true,desktopAndMobile:true,revokedSessionsRejected:true,passwordAndRoleChangesRejected:true,temporaryFailurePreservesToken:true,retryRecovers:true,oldRequestCannotLogOutNewSession:true,tamperedTokenRejected:true,automaticExpiry:true,storage:'sessionStorage; token only; validated by /auth/me'};
 fs.writeFileSync(path.resolve(__dirname,'../../../05_Testing/PhienDangNhapVaDangXuat.json'),JSON.stringify(report,null,2)+'\n');
 ok('Session restore rejects locks/password/role changes and forged tokens, recovers after temporary API failure, ignores stale expiry events and expires automatically');
};
