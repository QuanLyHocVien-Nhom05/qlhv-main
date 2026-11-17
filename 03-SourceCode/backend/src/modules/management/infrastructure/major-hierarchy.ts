import {Resource,ref} from '../domain/resource';

export function addMajorHierarchy(resources:Resource[]){
 const majors=resources.find(r=>r.key==='majors')!;
 majors.label='Ngành và chuyên ngành';
 majors.description='Ngành gốc và chuyên ngành trực thuộc, cùng đơn vị quản lý.';
 majors.query=majors.query.replace('SELECT n.*,','SELECT n.*,(SELECT TenNganh FROM danh_muc.Nganh cha WHERE cha.MaNganh=n.MaNganhCha) AS TenNganhCha,');
 majors.columns.splice(2,0,'TenNganhCha');
 const parent=ref('MaNganhCha','Ngành cha (bỏ trống nếu là ngành gốc)','majors',false);
 majors.fields.push(parent);
 const parentCheck=`IF @MaNganhCha IS NOT NULL AND NOT EXISTS(SELECT 1 FROM danh_muc.Nganh WITH(UPDLOCK,HOLDLOCK) WHERE MaNganh=@MaNganhCha AND MaDonVi=@MaDonVi AND DangHoatDong=1)
 THROW 51091,N'Ngành cha phải đang hoạt động và cùng đơn vị.',1;`;
 majors.insert=parentCheck+`INSERT danh_muc.Nganh(KyHieu,TenNganh,MaDonVi,MaNganhCha) VALUES(@KyHieu,@TenNganh,@MaDonVi,@MaNganhCha)`;
 const edit=majors.actions!.find(a=>a.key==='edit')!;
 edit.fields.push(parent);
 edit.sql=parentCheck+`
 ;WITH Cha AS(SELECT MaNganh,MaNganhCha FROM danh_muc.Nganh WITH(UPDLOCK,HOLDLOCK) WHERE MaNganh=@MaNganhCha
 UNION ALL SELECT n.MaNganh,n.MaNganhCha FROM danh_muc.Nganh n JOIN Cha c ON n.MaNganh=c.MaNganhCha)
 SELECT MaNganh INTO #NganhCha FROM Cha OPTION(MAXRECURSION 100);
 IF EXISTS(SELECT 1 FROM #NganhCha WHERE MaNganh=@Id) THROW 51091,N'Cây ngành/chuyên ngành không được tạo vòng lặp.',1;
 IF EXISTS(SELECT 1 FROM danh_muc.Nganh WITH(UPDLOCK,HOLDLOCK) WHERE MaNganhCha=@Id AND MaDonVi<>@MaDonVi)
 THROW 51091,N'Cần chuyển các chuyên ngành về cùng đơn vị trước.',1;
 `+edit.sql.replace('SET KyHieu=@KyHieu,','SET MaNganhCha=@MaNganhCha,KyHieu=@KyHieu,');
}
