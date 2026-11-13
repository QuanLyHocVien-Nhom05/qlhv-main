'use client';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api-client';
const reportFields:Record<string,string>={SoHoSo:'Số hồ sơ',HoTen:'Họ tên',TenDot:'Đợt tuyển sinh',TenNganh:'Ngành',TrinhDo:'Trình độ',PhuongThuc:'Phương thức',TrangThai:'Trạng thái',LePhiDaThu:'Lệ phí đã thu',PhiNhapHocDaThu:'Phí nhập học đã thu'};
function parse(value:unknown):any[]{try{const rows=JSON.parse(String(value));return Array.isArray(rows)?rows:[];}catch{return [];}}
export function EnrollmentClassesField({token,value,onChange,disabled}:{token:string;value:unknown;onChange:(v:string)=>void;disabled?:boolean}){
 const query=useQuery({queryKey:['options','classes',token],queryFn:()=>api<{Id:number;Ten:string}[]>('/management/options/classes',token)});
 return <label>Lớp học phần tự xếp<select multiple aria-label="Lớp học phần tự xếp" value={parse(value).map(String)} disabled={disabled||query.isPending||!!query.error} onChange={e=>onChange(JSON.stringify(Array.from(e.target.selectedOptions,o=>Number(o.value))))}>{query.data?.map(row=><option key={row.Id} value={row.Id}>{row.Ten}</option>)}</select><small>Chọn các lớp cần đăng ký khi nhập học. Máy chủ kiểm tra chương trình, sĩ số và tiên quyết.</small>{query.error&&<span className="error">{query.error.message}</span>}</label>;
}
export function ReportColumnsField({value,onChange,disabled}:{value:unknown;onChange:(v:string)=>void;disabled?:boolean}){
 const rows=parse(value) as {key:string;title:string}[];
 const save=(next:typeof rows)=>onChange(JSON.stringify(next));
 const move=(index:number,offset:number)=>{const next=[...rows];[next[index],next[index+offset]]=[next[index+offset],next[index]];save(next);};
 return <fieldset disabled={disabled}><legend>Các cột của biểu mẫu</legend>{rows.map((row,i)=><div className="surface" key={i}><label>Trường dữ liệu cột {i+1}<select value={row.key} onChange={e=>save(rows.map((r,j)=>j===i?{key:e.target.value,title:reportFields[e.target.value]}:r))}>{Object.entries(reportFields).map(([key,title])=><option key={key} value={key} disabled={rows.some((r,j)=>j!==i&&r.key===key)}>{title}</option>)}</select></label><label>Tên hiển thị cột {i+1}<input required maxLength={150} value={row.title} onChange={e=>save(rows.map((r,j)=>j===i?{...r,title:e.target.value}:r))}/></label><div className="button-row"><button type="button" className="secondary" disabled={i===0} onClick={()=>move(i,-1)}>Lên</button><button type="button" className="secondary" disabled={i===rows.length-1} onClick={()=>move(i,1)}>Xuống</button><button type="button" className="secondary" onClick={()=>save(rows.filter((_,j)=>i!==j))}>Bỏ cột</button></div></div>)}<button type="button" className="secondary" disabled={rows.length>=Object.keys(reportFields).length} onClick={()=>{const key=Object.keys(reportFields).find(k=>!rows.some(r=>r.key===k));if(key)save([...rows,{key,title:reportFields[key]}]);}}>Thêm cột</button></fieldset>;
}
