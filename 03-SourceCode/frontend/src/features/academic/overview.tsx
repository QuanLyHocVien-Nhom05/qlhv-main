'use client';
import {useQuery} from '@tanstack/react-query';
import {Users,Clock3,Activity,FileBarChart,ArrowRight,LibraryBig,CalendarDays,CheckCheck} from 'lucide-react';
import {api} from '@/lib/api-client';
import {display} from '@/components/academic/form-controls';
import type {Row} from '@/types/academic';

const metrics=[
 {key:'DotTuyen',title:'Đợt tuyển sinh',note:'Kế hoạch và mốc thời gian',icon:CalendarDays,group:'admissions',tab:'admission-batches',tone:'green'},
 {key:'HoSo',title:'Hồ sơ dự tuyển',note:'Trong phạm vi quản lý',icon:Users,group:'admissions',tab:'desk',tone:'blue'},
 {key:'ChoThamDinh',title:'Chờ thẩm định / bổ sung',note:'Hồ sơ cần cán bộ xử lý',icon:Clock3,group:'admissions',tab:'desk',tone:'amber'},
 {key:'DaBanGiao',title:'Đã bàn giao học viên',note:'Hoàn tất thủ tục nhập học',icon:CheckCheck,group:'admissions',tab:'admission-transfers',tone:'purple'},
];
const actions:Record<string,string>={TU_DONG_MO_DOT:'Tự động mở đợt',TU_DONG_DONG_DOT:'Tự động đóng đợt',NOP_HO_SO:'Nộp hồ sơ',THAM_DINH:'Thẩm định hồ sơ',BAN_GIAO_HOC_VIEN:'Bàn giao học viên',schedule:'Lên lịch đợt tuyển',open:'Mở đợt tuyển',close:'Đóng đợt tuyển',TAO_MOI:'Tạo cấu hình tuyển sinh'};
export function Overview({token,navigate}:{token:string;navigate:(key:string,tab?:string)=>void}){
 const query=useQuery({queryKey:['overview',token],queryFn:()=>api<{summary:Record<string,number>;activity:Row[]}>('/management/overview',token)});
 return <>
  {query.error&&<p role="alert" className="error">{query.error.message}<button onClick={()=>void query.refetch()}>Thử lại</button></p>}
  <section className="overview-banner"><div className="overview-banner-copy"><span className="section-kicker">TUYỂN SINH SAU ĐẠI HỌC</span><h2>Theo dõi từng hồ sơ,<br/><em>từ dự tuyển đến nhập học.</em></h2><p>Lập kế hoạch, thẩm định, tổ chức thi và xét tuyển theo từng đợt.</p><button onClick={()=>navigate('admissions','desk')}>Xử lý hồ sơ<ArrowRight size={17}/></button></div></section>
  <div className="metric-grid">{metrics.map(item=><button className={'metric-card tone-'+item.tone} key={item.key} onClick={()=>navigate(item.group,item.tab)}><div className="metric-top"><span className="metric-icon"><item.icon size={21}/></span></div><strong>{query.data?new Intl.NumberFormat('vi-VN').format(query.data.summary[item.key]??0):'—'}</strong><span className="metric-title">{item.title}</span><small>{item.note}</small></button>)}</div>
  <div className="overview-columns"><section className="surface activity-panel"><div className="surface-heading"><h2>Hoạt động tuyển sinh gần đây</h2><Activity size={20}/></div>
   {query.isPending?<p role="status">Đang tải hoạt động…</p>:!query.data?.activity.length?<p>Chưa có hoạt động tuyển sinh trong phạm vi hiển thị.</p>:<ol className="activity-list">{query.data.activity.map(row=><li key={String(row.MaNhatKy)}><span className="activity-list-dot"/><div><strong>{actions[String(row.HanhDong)]??display(row.HanhDong)}</strong><p>{String(row.HoTen)}</p></div><time dateTime={String(row.ThoiDiem)}>{display(row.ThoiDiem)}</time></li>)}</ol>}
  </section><section className="surface shortcuts-panel"><h2>Công việc tuyển sinh</h2>{[
   {group:'admissions',tab:'admission-batches',title:'Kế hoạch đợt tuyển',text:'Lịch, chỉ tiêu và quy tắc',icon:CalendarDays},
   {group:'admissions',tab:'desk',title:'Thẩm định hồ sơ',text:'Đối chiếu và yêu cầu bổ sung',icon:Users},
   {group:'reports',tab:'',title:'Báo cáo tuyển sinh',text:'Hồ sơ, trúng tuyển và lệ phí',icon:FileBarChart},
   {group:'catalogs',tab:'majors',title:'Ngành và chuyên ngành',text:'Danh mục dùng cho chỉ tiêu',icon:LibraryBig},
  ].map(item=><button className="shortcut" key={item.title} onClick={()=>navigate(item.group,item.tab)}><span className="shortcut-icon"><item.icon size={20}/></span><span><strong>{item.title}</strong><small>{item.text}</small></span><ArrowRight size={16}/></button>)}</section></div>
 </>;
}
