const fs=require('node:fs'),path=require('node:path');
exports.files=['02_KhungChuongTrinh.sql','03_TaiKhoan.sql','04_TuongThichDuLieu.sql','05_DuLieuKhoiTao.sql','06_KhoiPhucMatKhau.sql','08_NangCapDaoTao.sql','09_TuyenSinhTheoDacTa.sql','10_DuLieuCongKhai.sql','11_DonDepThuocTinhCu.sql','12_HoanThienTuyenSinh.sql','13_NguonDuLieuAGU.sql'];
exports.apply=async function(pool,fresh=false){
 for(const name of [...(fresh?['01_CauTruc.sql']:[]),...exports.files]){
  const source=fs.readFileSync(path.resolve(__dirname,'../../../04_Infrastructure/SQLServer',name),'utf8');
  for(const batch of source.split(/^\s*GO\s*\r?$/mi).filter(x=>x.trim()))try{await pool.request().batch(batch);}catch(error){error.message=name+': '+error.message;throw error;}
 }
};
