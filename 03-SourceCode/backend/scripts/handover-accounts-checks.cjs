const assert=require('node:assert/strict');
module.exports=async({call,unit,password,studentId,studentToken,ok})=>{
 for(const [key,role]of [['leader','LANH_DAO'],['officer','CAN_BO'],['lecturer','GIANG_VIEN'],['reviewer','GIANG_VIEN']]){
  await call('/admin/accounts',{TenDangNhap:'qa.'+key,HoTen:'QA '+key,ThuDienTu:key+'@example.invalid',VaiTro:role,MatKhau:password,XacNhanMatKhau:password,MaDonVi:Number(unit.Id),HocVi:'TIEN_SI'},201);
  const session=await call('/auth/login',{username:'qa.'+key,password},201,'');
  await call('/admin/accounts',undefined,403,session.accessToken);
  await call('/management/registrations/1/actions/grade',{values:{DiemTongKet:9}},403,session.accessToken);
 }
 await call('/admin/accounts',{TenDangNhap:'qa.student',HoTen:'QA student',ThuDienTu:'qa-student@example.invalid',VaiTro:'USER',MatKhau:password,XacNhanMatKhau:password},201);
 await call('/my/studies/'+studentId+'/registrations',{MaLopHocPhan:1},404,studentToken);
 await call('/management/registrations/1/actions/grade',{values:{DiemTongKet:9}},403);
 await call('/management/registrations/1/actions/adjust',{values:{DiemMoi:9}},403);
 await call('/management/registrations',{values:{MaHocVien:studentId,MaLopHocPhan:1}},403);
 await call('/management/students',{values:{}},403);
 const meta=await call('/management/metadata');
 const registrations=meta.find(r=>r.key==='registrations'),students=meta.find(r=>r.key==='students');
 assert.equal(registrations.canCreate,false);assert.deepEqual(registrations.actions,[]);
 assert.equal(students.canCreate,false);assert.ok(students.actions.every(a=>a.key==='cohort'));
 ok('Staff roles are isolated; self-registration, academic grades and manual student creation are disabled while handover stays readable');
};
