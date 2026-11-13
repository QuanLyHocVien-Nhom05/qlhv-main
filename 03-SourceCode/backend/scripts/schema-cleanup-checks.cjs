const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async(pool,ok)=>{
 const script=fs.readFileSync(path.resolve(__dirname,'../../../04_Infrastructure/SQLServer/11_DonDepThuocTinhCu.sql'),'utf8').replace(/^\s*GO\s*$/gmi,'');
 const snapshot=async()=>(await pool.request().query('SELECT MaNguoi,HoTen,ThuDienTu FROM danh_muc.Nguoi ORDER BY MaNguoi;SELECT MaCanBo,MaNguoi,MaDonVi,HocVi FROM nhan_su.CanBo ORDER BY MaCanBo')).recordsets;
 const before=await snapshot();
 await pool.request().query(`ALTER TABLE danh_muc.Nguoi ADD DiaChi nvarchar(500) NULL;
 ALTER TABLE nhan_su.CanBo ADD HocHam varchar(20) NULL CHECK(HocHam IN('GIAO_SU','PHO_GIAO_SU')),LaCanBoCoHuu bit NOT NULL DEFAULT 1,SoDeTaiToiDa int NOT NULL DEFAULT 5 CHECK(SoDeTaiToiDa>0);
 ALTER TABLE hoc_thuat.PhienBanChuongTrinh ADD SoCongBoToiThieu smallint NOT NULL DEFAULT 0 CHECK(SoCongBoToiThieu>=0);
 ALTER TABLE he_thong.TaiKhoanDangNhap ADD TotpSecret nvarchar(1000) NULL,TotpDraft nvarchar(1000) NULL,TotpDraftUntil datetime2 NULL,TotpCounter bigint NOT NULL DEFAULT -1;`);
 await pool.request().query('CREATE VIEW dbo.v_KiemThuCotCu AS SELECT MaNguoi,DiaChi FROM danh_muc.Nguoi');
 await assert.rejects(()=>pool.request().batch(script),/dang duoc ma SQL su dung/);
 assert.notEqual((await pool.request().query("SELECT COL_LENGTH('danh_muc.Nguoi','DiaChi') AS N")).recordset[0].N,null);
 await pool.request().query('DROP VIEW dbo.v_KiemThuCotCu');await pool.request().batch(script);await pool.request().batch(script);
 const leftovers=(await pool.request().query("SELECT COUNT(*) AS N FROM sys.columns WHERE (object_id=OBJECT_ID('danh_muc.Nguoi') AND name='DiaChi') OR(object_id=OBJECT_ID('nhan_su.CanBo') AND name IN('HocHam','LaCanBoCoHuu','SoDeTaiToiDa')) OR(object_id=OBJECT_ID('hoc_thuat.PhienBanChuongTrinh') AND name='SoCongBoToiThieu') OR(object_id=OBJECT_ID('he_thong.TaiKhoanDangNhap') AND name IN('TotpSecret','TotpDraft','TotpDraftUntil','TotpCounter'))")).recordset[0].N;
 assert.equal(leftovers,0);assert.deepEqual(await snapshot(),before);
 ok('Schema cleanup preserves people/staff, removes nine obsolete columns and defaults/checks, refuses live view dependencies and is repeatable');
};
