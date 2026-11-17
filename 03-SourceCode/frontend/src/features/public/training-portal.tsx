'use client';
import Link from 'next/link';
import {useQuery} from '@tanstack/react-query';
import {PublicShell} from '@/components/public/public-shell';
import {api} from '@/lib/api-client';
import {useSession} from '@/features/auth/session-provider';
import {display} from '@/components/academic/form-controls';

type Document={MaVanBan:number;SoVanBan:string;TieuDe:string;NgayBanHanh:string|null;DuongDan:string;MaDinhDanhNoiBo?:boolean;GhiChuNguon?:string|null;NgayKiemChung?:string|null;KieuKiemChung?:string|null;PhanLoai:string};
export function TrainingPortal(){
 const query=useQuery({queryKey:['public-documents'],queryFn:()=>api<Document[]>('/public/documents','')});
 return <PublicShell><main className="public-section"><p className="public-overline">TUYỂN SINH SAU ĐẠI HỌC</p><h1>Thông báo &amp; hướng dẫn</h1><p>Văn bản tuyển sinh và hướng dẫn đã công bố.</p>
  {query.error&&<p className="error" role="alert">{query.error.message}</p>}
  {query.isPending?<p>Đang tải…</p>:query.data?.length===0?<p>Chưa có văn bản được công bố.</p>:query.data?.map(v=><article className="public-auth-card" key={v.MaVanBan}>
   <small>{v.MaDinhDanhNoiBo?'Mã quản lý: ':'Số văn bản: '}{v.SoVanBan} · {display(v.PhanLoai)} · {v.NgayBanHanh?display(v.NgayBanHanh):'Ngày ban hành chưa xác minh'}</small><h2>{v.TieuDe}</h2>
   {v.GhiChuNguon&&<p>{v.GhiChuNguon}</p>}{v.KieuKiemChung==='CHI_MUC_TIM_KIEM'&&<p>Đối chiếu chỉ mục tìm kiếm ngày {display(v.NgayKiemChung)}; chưa tải lại được PDF nguồn.</p>}
   {/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/)/i.test(v.DuongDan)&&<a href={v.DuongDan} target="_blank" rel="noopener noreferrer">Mở văn bản ↗</a>}
  </article>)}
 </main></PublicShell>;
}
export function MyTraining(){
 const {session}=useSession();
 const query=useQuery({queryKey:['my-training',session?.accessToken],queryFn:()=>api<{advisors:{MaSoHocVien:string;GiangVienHuongDan:string;NgayPhanCong:string}[]}>('/my/training',session!.accessToken),enabled:!!session?.user.roles.includes('STUDENT')});
 return <PublicShell><main className="public-section"><h1>Người hướng dẫn khoa học</h1>
  {!session?<Link href="/dang-nhap">Đăng nhập để xem thông tin bàn giao</Link>:!session.user.roles.includes('STUDENT')?<Link href="/tuyen-sinh">Mở hồ sơ tuyển sinh</Link>:<>
   {query.error&&<p className="error" role="alert">{query.error.message}</p>}{query.isPending&&<p>Đang tải thông tin…</p>}
   {query.data?.advisors.length===0&&<p>Chưa có người hướng dẫn được phân công khi bàn giao.</p>}
   {query.data?.advisors.map(a=><article className="surface" key={a.MaSoHocVien}><h2>{a.MaSoHocVien}</h2><p>Người hướng dẫn: {a.GiangVienHuongDan}</p><p>Ngày phân công: {display(a.NgayPhanCong)}</p></article>)}
   <Link href="/hoc-tap">Xem thông tin học viên</Link>
  </>}
 </main></PublicShell>;
}
