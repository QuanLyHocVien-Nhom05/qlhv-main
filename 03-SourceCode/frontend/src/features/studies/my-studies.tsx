'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {PublicShell} from '@/components/public/public-shell';
import {useSession} from '@/features/auth/session-provider';
import {api} from '@/lib/api-client';
import {display} from '@/components/academic/form-controls';

type Student={MaHocVien:number;MaSoHocVien:string;TenChuongTrinh:string;TenNganh:string;TrinhDo:string;NgayNhapHoc:string;KhoaTuyenSinh:string;LopQuanLy:string|null;TrangThai:string};
type AssignedClass={MaLopHocPhan:number;KyHieuLop:string;TenHocPhan:string;NamHoc:string;HocKy:number;GiangVien:string};
export function MyStudies(){
 const {session}=useSession();
 return <PublicShell>{!session?<main className="public-empty"><h1>Thông tin bàn giao học viên</h1><p>Đăng nhập để xem mã học viên, chương trình, lớp và người hướng dẫn sau khi nhập học.</p><Link href="/dang-nhap">Đăng nhập</Link></main>:!session.user.roles.includes('STUDENT')?<main className="public-empty"><h1>Thông tin dành cho học viên</h1><p>Tài khoản được chuyển sang học viên sau khi hoàn tất thủ tục và bàn giao.</p><Link href="/tuyen-sinh">Xem hồ sơ tuyển sinh</Link></main>:<HandoverWorkspace token={session.accessToken}/>}</PublicShell>;
}
function HandoverWorkspace({token}:{token:string}){
 const [selected,setSelected]=useState('');
 const students=useQuery({queryKey:['my-students',token],queryFn:()=>api<Student[]>('/my/studies',token)});
 const active=students.data?.find(s=>String(s.MaHocVien)===selected)??students.data?.[0];
 const detail=useQuery({queryKey:['my-handover',token,active?.MaHocVien],queryFn:()=>api<{HocVien:Student;LopHocPhan:AssignedClass[]}>('/my/studies/'+active!.MaHocVien,token),enabled:!!active});
 return <main className="public-section"><p className="public-overline">SAU NHẬP HỌC</p><h1>Thông tin bàn giao học viên</h1>
  {students.error&&<p className="error" role="alert">{students.error.message}</p>}{students.isPending&&<p>Đang tải thông tin…</p>}
  {students.data?.length===0&&<p>Chưa có hồ sơ học viên được bàn giao.</p>}
  {!!students.data?.length&&<label>Hồ sơ học viên<select value={active?.MaHocVien??''} onChange={e=>setSelected(e.target.value)}>{students.data.map(s=><option key={s.MaHocVien} value={s.MaHocVien}>{s.MaSoHocVien} · {s.TenChuongTrinh}</option>)}</select></label>}
  {detail.error&&<p className="error" role="alert">{detail.error.message}</p>}{detail.isFetching&&<p>Đang tải chi tiết…</p>}
  {detail.data&&<><section className="surface"><h2>{detail.data.HocVien.MaSoHocVien}</h2><dl className="record-details">{[
   ['Chương trình',detail.data.HocVien.TenChuongTrinh],['Ngành',detail.data.HocVien.TenNganh],['Trình độ',display(detail.data.HocVien.TrinhDo)],['Khóa',detail.data.HocVien.KhoaTuyenSinh],['Ngày nhập học',display(detail.data.HocVien.NgayNhapHoc)],['Lớp quản lý',detail.data.HocVien.LopQuanLy??'Chưa phân lớp'],
  ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
  <section className="surface"><h2>Lớp học phần đã được xếp</h2>{detail.data.LopHocPhan.length===0?<p>Chưa có lớp học phần được phân công.</p>:<div className="table-scroll"><table><thead><tr><th>Lớp</th><th>Học phần</th><th>Năm học</th><th>Học kỳ</th><th>Giảng viên</th></tr></thead><tbody>{detail.data.LopHocPhan.map(l=><tr key={l.MaLopHocPhan}><td>{l.KyHieuLop}</td><td>{l.TenHocPhan}</td><td>{l.NamHoc}</td><td>{l.HocKy}</td><td>{l.GiangVien}</td></tr>)}</tbody></table></div>}</section></>}
  <div className="button-row"><Link href="/nguoi-huong-dan">Người hướng dẫn khoa học</Link><Link href="/tuyen-sinh">Hồ sơ tuyển sinh</Link></div>
 </main>;
}
