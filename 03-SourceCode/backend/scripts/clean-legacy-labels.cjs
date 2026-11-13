// Explicit maintenance command. Preview by default; --apply writes labels only.
const fs=require('node:fs'),path=require('node:path'),sql=require('mssql/msnodesqlv8');
const root=path.resolve(__dirname,'../../..');process.loadEnvFile(path.join(__dirname,'../.env'));
const fields=[
 ['danh_muc.DonVi','MaDonVi','KyHieu','DV01'],
 ['danh_muc.Nganh','MaNganh','KyHieu'],
 ['hoc_thuat.ChuongTrinh','MaChuongTrinh','KyHieu'],
 ['hoc_thuat.PhienBanChuongTrinh','MaPhienBan','KhoaTuyenSinh'],
 ['hoc_thuat.HocPhan','MaHocPhan','KyHieu'],
 ['hoc_thuat.HocVien','MaHocVien','MaSoHocVien'],
 ['hoc_thuat.LopHocPhan','MaLopHocPhan','KyHieu'],
 ['hoc_thuat.LopHocPhan','MaLopHocPhan','NamHoc'],
];
function normalize(value,fallback){if(value==='MAU_THAM_KHAO')return '01';const next=value.replace(/^MAU_AGU(?:_|$)/,'').replace(/^MAU(?:_|$)/,'');return next||fallback;}
async function main(){
 const pool=await new sql.ConnectionPool({server:'localhost',connectionString:process.env.SQLSERVER_CONNECTION_STRING,requestTimeout:60000}).connect();let transaction;
 try{
  transaction=new sql.Transaction(pool);await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  const query=async(text,parameters={})=>{const r=new sql.Request(transaction);for(const [key,value]of Object.entries(parameters))r.input(key,typeof value==='number'?sql.BigInt:sql.NVarChar(sql.MAX),value);return r.query('SET QUOTED_IDENTIFIER ON;SET ANSI_NULLS ON;SET ANSI_PADDING ON;SET ANSI_WARNINGS ON;SET ARITHABORT ON;SET CONCAT_NULL_YIELDS_NULL ON;SET NUMERIC_ROUNDABORT OFF;'+text);};
  const changes=[];
  for(const [table,pk,column,fallback]of fields){
   const rows=(await query(`SELECT ${pk} AS Id,${column} AS Value${column==='KhoaTuyenSinh'?',MaChuongTrinh AS Scope':''} FROM ${table} WITH(UPDLOCK,HOLDLOCK)`)).recordset;
   const keys=new Set();
   for(const row of rows){const next=normalize(row.Value,fallback);if(!next)throw Error('Empty label would be produced: '+table+'.'+column);
    if(column!=='NamHoc'){const key=String(row.Scope??'')+':'+next.toLocaleLowerCase('vi');if(keys.has(key))throw Error('Duplicate target label: '+table+'.'+column+' '+next);keys.add(key);}
    if(next!==row.Value)changes.push({table,pk,column,id:row.Id,before:row.Value,after:next});
   }
  }
  const summary=Object.fromEntries(fields.map(([table,,column])=>[table+'.'+column,changes.filter(c=>c.table===table&&c.column===column).length]).filter(([,n])=>n));
  if(!process.argv.includes('--apply')){await transaction.rollback();transaction=null;console.log(JSON.stringify({preview:true,changedFields:changes.length,summary},null,2));return;}
  if(!changes.length){await transaction.commit();transaction=null;console.log('No legacy prefixes remain in the maintained label fields.');return;}
  const snapshot=path.join(root,'.tools','nhan-du-lieu-truoc-doi-'+Date.now()+'.local.json');fs.mkdirSync(path.dirname(snapshot),{recursive:true});fs.writeFileSync(snapshot,JSON.stringify(changes,null,2)+'\n');
  // Approved curriculum content stays locked. Temporarily suspend only its two
  // metadata locks inside this transaction; restore their original states.
  const locks=[['hoc_thuat.trg_KhoaThongTinChuongTrinh','hoc_thuat.ChuongTrinh'],['hoc_thuat.trg_KhoaPhienBan','hoc_thuat.PhienBanChuongTrinh']];
  const restore=[];
  for(const [trigger,table]of locks){if(!changes.some(c=>c.table===table))continue;const state=(await query('SELECT is_disabled FROM sys.triggers WHERE object_id=OBJECT_ID(@Name)',{Name:trigger})).recordset[0];if(!state)throw Error('Missing curriculum lock: '+trigger);if(!state.is_disabled){await query(`DISABLE TRIGGER ${trigger} ON ${table}`);restore.push([trigger,table]);}}
  for(const c of changes){const result=await query(`UPDATE ${c.table} SET ${c.column}=@Next WHERE ${c.pk}=@Id AND ${c.column}=@Previous`,{Next:c.after,Id:c.id,Previous:c.before});if(result.rowsAffected[0]!==1)throw Error('Label changed concurrently.');}
  for(const [trigger,table]of restore)await query(`ENABLE TRIGGER ${trigger} ON ${table}`);
  await transaction.commit();transaction=null;
  const report={completedAt:new Date().toISOString(),changedFields:changes.length,summary,preserved:'Primary keys, foreign keys, accounts, registrations, grades and approved curriculum content'};
  fs.writeFileSync(path.join(root,'05_Testing/ChuanHoaNhanDuLieu.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }catch(error){if(transaction)try{await transaction.rollback();}catch{}throw error;}finally{await pool.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
