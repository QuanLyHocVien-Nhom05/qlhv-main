const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=async({call,pool,browser,password,token,base,ok})=>{
 const create=(key,values)=>call('/management/'+key,{values},201),rows=async key=>(await call('/management/'+key+'?limit=100')).data;
 const iso=days=>new Date(Date.now()+days*86400000).toISOString(),major=(await call('/management/options/majors'))[0];
 await create('admission-batches',{KyHieu:'AGU_CV_TEST',TenDot:'AGU CV Test',MoHoSo:iso(-1),DongHoSo:iso(2),HanThamDinh:iso(3),HanBoSung:iso(3),NgayThi:iso(4),NgayCongBo:iso(5),HanPhucKhao:iso(6),HanNhapHoc:iso(7)});
 const dot=(await rows('admission-batches')).find(r=>r.KyHieu==='AGU_CV_TEST').MaDot;
 const docs=['BANG_DAI_HOC','BANG_DIEM','CHUNG_CHI_NGOAI_NGU','LY_LICH_KHOA_HOC','GIAY_KHAM_SUC_KHOE','DONG_Y_CO_QUAN','SO_YEU_LY_LICH'];
 await create('admission-quotas',{MaDot:dot,MaNganh:major.Id,TrinhDo:'THAC_SI',PhuongThuc:'XET_TUYEN',SoLuong:2,LePhi:0,PhiNhapHoc:0,GpaToiThieu:5,HeSoCoSo:1,HeSoChuyenNganh:1,HeSoNgoaiNgu:1,HeSoUuTien:1,DiemSan:0,TieuChiPhu:'GPA',TaiLieuBatBuoc:JSON.stringify(docs)});
 const quota=(await rows('admission-quotas')).find(r=>r.MaDot===dot).MaChiTieu;
 await create('admission-certificates',{MaChiTieu:quota,TenChungChi:'IELTS',DiemToiThieu:6,DiemQuyDoi:8});
 await create('admission-major-rules',{MaChiTieu:quota,TenNganh:'IT',PhanLoai:'DUNG',MonBoSung:null});
 await call(`/management/admission-batches/${dot}/actions/open`,{values:{}},201);
 const candidate=(await call('/auth/login',{username:'qr.demo@example.invalid',password},201,'')).accessToken;
 const other=(await call('/auth/login',{username:'qa.student',password},201,'')).accessToken;
 const seed=(await call('/my/admissions',undefined,200,candidate))[0];
 const profile=(await call('/my/admissions/'+seed.MaHoSo,undefined,200,candidate)).profile;
 profile.SoYeuLyLich={PhienBan:'AGU_2026',NoiSinh:'An Giang'};
 let h=await call('/my/admissions',{MaChiTieu:quota,profile},201,candidate);const id=h.MaHoSo;
 assert.equal(h.profile.SoYeuLyLich.CamDoan,false);
 const original=(await fetch('http://localhost:3100/tai-lieu/ho-so-du-tuyen-thac-si-agu-2026.doc'));assert.equal(original.status,200);
 assert.equal(crypto.createHash('sha256').update(Buffer.from(await original.arrayBuffer())).digest('hex'),h.profileForm.sha256);
 const pdf=Buffer.from(await(await require('pdf-lib').PDFDocument.create()).save());
 for(const type of docs){const form=new FormData();form.append('LoaiTaiLieu',type);form.append('file',new Blob([pdf],{type:'application/pdf'}),'cv-test-evidence.pdf');const response=await fetch(base+'/my/admissions/files',{method:'POST',headers:{Authorization:'Bearer '+candidate},body:form});assert.equal(response.status,201);const uploaded=await response.json();await call(`/my/admissions/${id}/documents`,{MaTaiLieu:Number(uploaded.MaTaiLieu)},201,candidate);}
 h=await call(`/my/admissions/${id}`,undefined,200,candidate);
 await call(`/my/admissions/${id}/submit`,{Version:h.Version},400,candidate);
 assert.equal((await call(`/my/admissions/${id}`,undefined,200,candidate)).TrangThai,'NHAP');
 await call(`/my/admissions/${id}/profile-form`,undefined,400,candidate);
 await call(`/my/admissions/${id}/profile-form`,undefined,404,other);
 ok('AGU template download matches the verified original; partial drafts persist but incomplete CVs cannot be submitted or exported as complete');

 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://localhost:3100/dang-nhap');await page.getByLabel('Tên đăng nhập',{exact:true}).fill('qr.demo@example.invalid');await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.getByRole('row').filter({hasText:'AGU CV Test'}).getByRole('button',{name:'Chi tiết hồ sơ',exact:true}).click();
 await page.getByRole('button',{name:'Chỉnh sửa hồ sơ',exact:true}).click();const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Giới tính',{exact:true}).selectOption('NAM');
 for(const [label,value]of [['Quê quán','An Giang'],['Dân tộc','Kinh'],['Tôn giáo','Không'],['Nơi đăng ký hộ khẩu thường trú','Địa chỉ kiểm thử'],['Địa chỉ liên lạc khi cần thiết','Địa chỉ liên hệ kiểm thử'],['Trình độ văn hóa','12/12'],['Trình độ ngoại ngữ','IELTS 6.5'],['Trình độ tin học','Cơ bản'],['Hình thức đào tạo đại học','Chính quy'],['Năm tốt nghiệp đại học','2022'],['Nghề nghiệp hiện nay','Kỹ sư kiểm thử']])await dialog.getByLabel(label,{exact:true}).fill(value);
 await dialog.getByRole('button',{name:'Thêm quá trình hoạt động',exact:true}).click();
 for(const [label,value]of [['Từ tháng','2018-09'],['Đến tháng','2022-06'],['Công việc','Học đại học'],['Đơn vị/cơ sở học tập','Trường kiểm thử'],['Chức vụ','Sinh viên']])await dialog.getByLabel('Hoạt động 1: '+label,{exact:true}).fill(value);
 for(const [i,relation]of ['CHA','ME','ANH_CHI_EM','VO_CHONG','CON'].entries()){
  await dialog.getByRole('button',{name:'Thêm người thân',exact:true}).click();
  await dialog.getByLabel(`Người thân ${i+1}: Quan hệ`,{exact:true}).selectOption(relation);
  await dialog.getByLabel(`Người thân ${i+1}: Họ và tên`,{exact:true}).fill('AGU_CV_PERSON_'+i);
  await dialog.getByLabel(`Người thân ${i+1}: Nơi ở hiện nay`,{exact:true}).fill('An Giang kiểm thử');
 }
 await dialog.getByLabel('Tôi đã kê khai phần gia đình phù hợp với hoàn cảnh của mình.',{exact:true}).check();
 await dialog.getByLabel('Tôi cam đoan thông tin sơ yếu lý lịch đã kê khai là đúng sự thật và chịu trách nhiệm về lời khai.',{exact:true}).check();
 await dialog.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();
 await require('@playwright/test').expect(dialog).not.toBeVisible();
 h=await call(`/my/admissions/${id}`,undefined,200,candidate);assert.equal(h.profile.SoYeuLyLich.GiaDinh.length,5);assert.equal(h.profile.SoYeuLyLich.QuaTrinhHoatDong.length,1);assert.equal(h.profile.SoYeuLyLich.CamDoan,true);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Tải sơ yếu lý lịch đã kê khai (PDF)',exact:true}).click();assert.equal((await download).suggestedFilename(),'so-yeu-ly-lich-agu.pdf');
 await page.screenshot({path:path.resolve(__dirname,'../../../05_Testing/Frontend/so-yeu-ly-lich-agu-mobile.png'),fullPage:true});
 const invalid={...h.profile,SoYeuLyLich:{...h.profile.SoYeuLyLich,DaXacNhan:true}};
 await call(`/my/admissions/${id}`,{MaChiTieu:quota,profile:invalid,Version:h.Version},400,candidate,'PUT');
 const future={...h.profile,SoYeuLyLich:{...h.profile.SoYeuLyLich,NgayVaoDang:'2999-01-01'}};
 await call(`/my/admissions/${id}`,{MaChiTieu:quota,profile:future,Version:h.Version},400,candidate,'PUT');
 const storage=(await pool.request().input('Id',id).query('SELECT HoSoMaHoa FROM tuyen_sinh.HoSo WHERE MaHoSo=@Id')).recordset[0].HoSoMaHoa;
 assert.ok(!storage.includes('AGU_CV_PERSON_'));assert.ok(!storage.includes('DanToc'));
 assert.equal(h.documents.find(d=>d.LoaiTaiLieu==='SO_YEU_LY_LICH').DaDoiChieu,false);
 await call(`/my/admissions/${id}/submit`,{Version:h.Version},201,candidate);
 await call(`/my/admissions/${id}/pay`,{LoaiPhi:'XET_TUYEN'},201,candidate);
 h=await call(`/my/admissions/${id}`,undefined,200,candidate);assert.equal(h.TrangThai,'DA_NOP');
 const staff=await call(`/admin/admissions/applications/${id}`);assert.equal(staff.profile.SoYeuLyLich.GiaDinh[0].HoTen,'AGU_CV_PERSON_0');
 await require('./core-database.cjs').apply(pool,false);
 assert.equal((await call(`/my/admissions/${id}`,undefined,200,candidate)).profile.SoYeuLyLich.GiaDinh.length,5);
 ok('AGU CV mobile forms save all family relations and activity history, export a private PDF, reject forged/future data, encrypt the payload and submit only after completion');
 await page.close();
 for(const file of(await pool.request().input('Id',id).query('SELECT KhoaLuuTru FROM tuyen_sinh.TaiLieu WHERE MaHoSo=@Id')).recordset){assert.match(file.KhoaLuuTru,/^[a-f0-9-]{36}\.enc$/);fs.unlinkSync(path.join(__dirname,'../storage/admissions',file.KhoaLuuTru));}
};
