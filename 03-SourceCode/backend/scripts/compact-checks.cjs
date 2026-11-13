const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async(pool,ok)=>{
 const cleanup=fs.readFileSync(path.resolve(__dirname,'../../../04_Infrastructure/SQLServer/07_TinhGonDuLieuCu.sql'),'utf8');
 const count=async()=>(await pool.request().query('SELECT COUNT(*) AS N FROM sys.tables WHERE is_ms_shipped=0')).recordset[0].N;
 assert.equal(await count(),50);
 await assert.rejects(()=>pool.request().query("EXEC sys.sp_set_session_context @key=N'ChoPhepTinhGon',@value=1;"+cleanup),/compact-database/);
 assert.equal(await count(),50);ok('Legacy cleanup cannot remove the required admissions domain');
};
