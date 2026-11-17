// Test-only helper: create explicit, approved councils for the existing exam fixtures.
module.exports=async({call,pool,ca})=>{
 const row=(await pool.request().query(`SELECT MaDot,MaHoiDong,HinhThuc FROM tuyen_sinh.CaThi WHERE MaCa=${Number(ca)}`)).recordset[0];if(row.MaHoiDong)return Number(row.MaHoiDong);
 const assigned=(await pool.request().query(`SELECT MaCanBo,VaiTro FROM tuyen_sinh.PhanCong WHERE MaCa=${Number(ca)}`)).recordset.map(r=>({...r,MaCanBo:Number(r.MaCanBo)}));
 const chair=assigned.find(r=>r.VaiTro==='COI_THI'||r.VaiTro==='CHU_TICH')?.MaCanBo,secretary=assigned.find(r=>r.MaCanBo!==chair)?.MaCanBo;
 if(!chair||!secretary)throw Error('Council fixture needs two distinct staff members.');
 const create=(key,values)=>call('/management/'+key,{values},201),action=(key,id,verb,values)=>call(`/management/${key}/${id}/actions/${verb}`,{values},201);
 await create('admission-councils',{MaDot:row.MaDot,TenHoiDong:'Test council '+ca,Loai:row.HinhThuc==='DE_CUONG'?'DE_CUONG':'THI_TUYEN',SoQuyetDinh:'QA-'+ca});
 let organization=await call(`/admin/admissions/batches/${row.MaDot}/exam-organization`),h=organization.councils.find(h=>h.TenHoiDong==='Test council '+ca);
 const members=[...assigned,{MaCanBo:chair,VaiTro:'CHU_TICH'},{MaCanBo:secretary,VaiTro:'THU_KY'}],seen=new Set();
 for(const member of members){const key=member.MaCanBo+':'+member.VaiTro;if(seen.has(key))continue;seen.add(key);await create('admission-council-members',{MaHoiDong:h.MaHoiDong,MaCanBo:member.MaCanBo,VaiTro:member.VaiTro});}
 organization=await call(`/admin/admissions/batches/${row.MaDot}/exam-organization`);h=organization.councils.find(c=>c.MaHoiDong===h.MaHoiDong);
 await action('admission-councils',h.MaHoiDong,'approve',{Version:h.Version});
 organization=await call(`/admin/admissions/batches/${row.MaDot}/exam-organization`);const exam=organization.exams.find(c=>Number(c.MaCa)===Number(ca));
 await action('admission-exams',ca,'council',{Version:exam.Version,MaHoiDong:h.MaHoiDong});return h.MaHoiDong;
};
