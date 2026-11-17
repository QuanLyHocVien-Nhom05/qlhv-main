'use client';
import {display} from '@/components/academic/form-controls';

export const aguFormUrl='/tai-lieu/ho-so-du-tuyen-thac-si-agu-2026.doc';
export const aguFormSource='https://tuyensinh.agu.edu.vn/uploads/cef1d278b0893dbc628f16e971848e37.doc';
const vietnamToday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
type Field={key:string;label:string;type?:'date'|'number';required?:boolean};
const groups:{title:string;fields:Field[]}[]=[
 {title:'I. Bản thân và liên hệ',fields:[
  {key:'NoiSinh',label:'Nơi sinh (tỉnh/thành phố)',required:true},{key:'QueQuan',label:'Quê quán',required:true},
  {key:'DanToc',label:'Dân tộc',required:true},{key:'TonGiao',label:'Tôn giáo',required:true},
  {key:'HoKhauThuongTru',label:'Nơi đăng ký hộ khẩu thường trú',required:true},{key:'DiaChiLienHe',label:'Địa chỉ liên lạc khi cần thiết',required:true},
  {key:'TrinhDoVanHoa',label:'Trình độ văn hóa',required:true},{key:'TrinhDoNgoaiNgu',label:'Trình độ ngoại ngữ',required:true},
  {key:'TrinhDoTinHoc',label:'Trình độ tin học',required:true},
 ]},
 {title:'Đào tạo đại học và công tác',fields:[
  {key:'HinhThucDaoTao',label:'Hình thức đào tạo đại học',required:true},{key:'NamTotNghiep',label:'Năm tốt nghiệp đại học',type:'number',required:true},
  {key:'NgheNghiep',label:'Nghề nghiệp hiện nay',required:true},{key:'ChucVu',label:'Chức vụ hiện nay'},
  {key:'DiaChiCoQuan',label:'Địa chỉ cơ quan công tác'},{key:'NgayBatDauCongTac',label:'Ngày bắt đầu công tác trong ngành dự tuyển',type:'date'},
  {key:'SoNamCongTac',label:'Số năm công tác trong chuyên ngành',type:'number'},
 ]},
 {title:'Thông tin Đoàn, Đảng (nếu có)',fields:[
  {key:'NgayVaoDoan',label:'Ngày vào Đoàn TNCS Hồ Chí Minh',type:'date'},{key:'NoiVaoDoan',label:'Nơi vào Đoàn'},
  {key:'NgayVaoDang',label:'Ngày vào Đảng Cộng sản Việt Nam',type:'date'},{key:'NoiVaoDang',label:'Nơi vào Đảng'},
 ]},
];
type Activity={TuThang:string;DenThang:string;CongViec:string;DonViCongTac:string;ChucVu:string};
type Relative={QuanHe:string;HoTen:string;NamSinh:number|null;Tuoi:number|null;NgheNghiep:string;NoiLamViec:string;NoiOHienNay:string};
export type Biography=Record<string,unknown>&{PhienBan:'AGU_2026';QuaTrinhHoatDong:Activity[];GiaDinh:Relative[];CamDoan:boolean;GiaDinhDaKhaiBao:boolean};
const relations:Record<string,string>={CHA:'Bố',ME:'Mẹ',ANH_CHI_EM:'Anh/chị/em ruột',VO_CHONG:'Vợ/chồng',CON:'Con'};
export function blankBiography():Biography{return {PhienBan:'AGU_2026',...Object.fromEntries(groups.flatMap(g=>g.fields).map(f=>[f.key,f.type==='number'?null:''])),GioiTinh:'',KhenThuong:'',KyLuat:'',GhiChuGiaDinh:'',QuaTrinhHoatDong:[],GiaDinh:[],GiaDinhDaKhaiBao:false,CamDoan:false};}
export function AguBiographyFields({value,onChange}:{value:Biography;onChange:(b:Biography)=>void}){
 const set=(key:string,v:unknown)=>onChange({...value,[key]:v});
 const updateActivity=(index:number,key:string,v:string)=>set('QuaTrinhHoatDong',value.QuaTrinhHoatDong.map((r,i)=>i===index?{...r,[key]:v}:r));
 const updateRelative=(index:number,key:string,v:unknown)=>set('GiaDinh',value.GiaDinh.map((r,i)=>i===index?{...r,[key]:v}:r));
 return <section aria-label="Sơ yếu lý lịch theo mẫu AGU"><h2>Sơ yếu lý lịch — AGU 2026</h2>
  <p>Tham chiếu phần Sơ yếu lý lịch trong bộ hồ sơ thạc sĩ do AGU công bố. Họ tên, ngày sinh, điện thoại, trường/ngành tốt nghiệp và đơn vị công tác lấy từ phần hồ sơ phía trên.</p>
  <p><a href={aguFormUrl} download>Tải bộ biểu mẫu gốc AGU (.doc)</a> · <a href={aguFormSource} target="_blank" rel="noopener noreferrer">Nguồn trường</a></p>
  <p>Có thể lưu nháp chưa đầy đủ. Các mục có dấu * cần hoàn thiện khi nộp; mục không áp dụng có thể ghi “Không/Chưa có” hoặc để trống nếu là mục tùy chọn. Dữ liệu tự khai không thay thế chữ ký, ảnh 3×4 và xác nhận trên bản giấy/bản scan.</p>
  <label>Giới tính *<select aria-label="Giới tính" value={String(value.GioiTinh??'')} onChange={e=>set('GioiTinh',e.target.value)}><option value="">Chọn</option><option value="NAM">Nam</option><option value="NU">Nữ</option><option value="KHAC">Khác</option></select></label>
  {groups.map(g=><section className="surface" key={g.title}><h3>{g.title}</h3><div className="form-grid">{g.fields.map(f=><label key={f.key}>{f.label}{f.required?' *':''}<input aria-label={f.label} type={f.type??'text'} maxLength={500} min={f.type==='number'?f.key==='NamTotNghiep'?1900:0:undefined} max={f.key==='NamTotNghiep'?Number(vietnamToday().slice(0,4)):f.key==='SoNamCongTac'?100:f.type==='date'?vietnamToday():undefined} step={f.type==='number'?1:undefined} value={String(value[f.key]??'')} onChange={e=>set(f.key,f.type==='number'?(e.target.value===''?null:Number(e.target.value)):e.target.value)}/></label>)}</div></section>)}
  <section className="surface"><h3>Quá trình hoạt động của bản thân *</h3><p>Bao gồm học tập, làm việc hoặc hoạt động khác. Để trống tháng kết thúc nếu đang tiếp tục; tối đa 20 dòng.</p>
   {value.QuaTrinhHoatDong.map((r,i)=><fieldset key={i}><legend>Hoạt động {i+1}</legend><div className="form-grid"><label>Từ tháng<input aria-label={`Hoạt động ${i+1}: Từ tháng`} type="month" value={r.TuThang} onChange={e=>updateActivity(i,'TuThang',e.target.value)}/></label><label>Đến tháng<input aria-label={`Hoạt động ${i+1}: Đến tháng`} type="month" value={r.DenThang} onChange={e=>updateActivity(i,'DenThang',e.target.value)}/></label>{[['CongViec','Công việc'],['DonViCongTac','Đơn vị/cơ sở học tập'],['ChucVu','Chức vụ']].map(([key,label])=><label key={key}>{label}<input aria-label={`Hoạt động ${i+1}: ${label}`} maxLength={300} value={r[key as keyof Activity]} onChange={e=>updateActivity(i,key,e.target.value)}/></label>)}</div><button type="button" className="secondary" onClick={()=>set('QuaTrinhHoatDong',value.QuaTrinhHoatDong.filter((_,n)=>n!==i))}>Xóa hoạt động {i+1}</button></fieldset>)}
   <button type="button" className="secondary" disabled={value.QuaTrinhHoatDong.length>=20} onClick={()=>set('QuaTrinhHoatDong',[...value.QuaTrinhHoatDong,{TuThang:'',DenThang:'',CongViec:'',DonViCongTac:'',ChucVu:''}])}>Thêm quá trình hoạt động</button>
  </section>
  <section className="surface"><h3>Khen thưởng và kỷ luật</h3><label>Khen thưởng<textarea aria-label="Khen thưởng" maxLength={500} value={String(value.KhenThuong??'')} onChange={e=>set('KhenThuong',e.target.value)}/></label><label>Kỷ luật<textarea aria-label="Kỷ luật" maxLength={500} value={String(value.KyLuat??'')} onChange={e=>set('KyLuat',e.target.value)}/></label></section>
  <section className="surface"><h3>II. Gia đình</h3><p>Kê khai bố, mẹ, anh/chị/em ruột, vợ/chồng và con theo mẫu. Bỏ dòng không áp dụng; không điền thông tin giả. Năm sinh/tuổi được để trống nếu chưa có thông tin.</p>
   {value.GiaDinh.map((r,i)=><fieldset key={i}><legend>Người thân {i+1}</legend><div className="form-grid"><label>Quan hệ<select aria-label={`Người thân ${i+1}: Quan hệ`} value={r.QuanHe} onChange={e=>updateRelative(i,'QuanHe',e.target.value)}>{Object.entries(relations).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label><label>Họ và tên<input aria-label={`Người thân ${i+1}: Họ và tên`} maxLength={150} value={r.HoTen} onChange={e=>updateRelative(i,'HoTen',e.target.value)}/></label>{[['NamSinh','Năm sinh'],['Tuoi','Tuổi']].map(([k,l])=><label key={k}>{l}<input aria-label={`Người thân ${i+1}: ${l}`} type="number" min={k==='NamSinh'?1850:0} max={k==='NamSinh'?Number(vietnamToday().slice(0,4)):130} step={1} value={r[k as 'NamSinh'|'Tuoi']??''} onChange={e=>updateRelative(i,k,e.target.value===''?null:Number(e.target.value))}/></label>)}{[['NgheNghiep','Nghề nghiệp'],['NoiLamViec','Nơi làm việc'],['NoiOHienNay','Nơi ở hiện nay']].map(([k,l])=><label key={k}>{l}<input aria-label={`Người thân ${i+1}: ${l}`} maxLength={k==='NoiOHienNay'?500:300} value={String(r[k as keyof Relative]??'')} onChange={e=>updateRelative(i,k,e.target.value)}/></label>)}</div><button type="button" className="secondary" onClick={()=>set('GiaDinh',value.GiaDinh.filter((_,n)=>n!==i))}>Xóa người thân {i+1}</button></fieldset>)}
   <button type="button" className="secondary" disabled={value.GiaDinh.length>=20} onClick={()=>set('GiaDinh',[...value.GiaDinh,{QuanHe:'ANH_CHI_EM',HoTen:'',NamSinh:null,Tuoi:null,NgheNghiep:'',NoiLamViec:'',NoiOHienNay:''}])}>Thêm người thân</button>
   <label>Ghi chú gia đình<textarea aria-label="Ghi chú gia đình" maxLength={500} value={String(value.GhiChuGiaDinh??'')} onChange={e=>set('GhiChuGiaDinh',e.target.value)}/></label>
   <label className="checkbox-label"><input type="checkbox" checked={value.GiaDinhDaKhaiBao} onChange={e=>set('GiaDinhDaKhaiBao',e.target.checked)}/>Tôi đã kê khai phần gia đình phù hợp với hoàn cảnh của mình.</label>
  </section>
  <label className="checkbox-label"><input type="checkbox" checked={value.CamDoan} onChange={e=>set('CamDoan',e.target.checked)}/>Tôi cam đoan thông tin sơ yếu lý lịch đã kê khai là đúng sự thật và chịu trách nhiệm về lời khai.</label>
 </section>;
}

export function AguBiographyView({value}:{value?:Biography}){
 if(!value)return <p className="info-note">Hồ sơ chưa có phần sơ yếu lý lịch điện tử AGU; dữ liệu lịch sử vẫn được giữ nguyên.</p>;
 const show=(v:unknown)=>v===null||v===undefined||v===''?'Chưa kê khai':String(v);
 return <section className="surface" aria-label="Sơ yếu lý lịch đã khai"><h3>Sơ yếu lý lịch — mẫu tham chiếu AGU 2026</h3><p>Giới tính: {({NAM:'Nam',NU:'Nữ',KHAC:'Khác'} as Record<string,string>)[String(value.GioiTinh)]??'Chưa kê khai'}</p>
  {groups.map(g=><section key={g.title}><h4>{g.title}</h4><dl className="record-details">{g.fields.map(f=><div key={f.key}><dt>{f.label}</dt><dd>{f.type==='date'&&value[f.key]?display(value[f.key]):show(value[f.key])}</dd></div>)}</dl></section>)}
  <h4>Quá trình hoạt động</h4>{value.QuaTrinhHoatDong?.length?value.QuaTrinhHoatDong.map((r,i)=><p key={i}>{r.TuThang} – {r.DenThang||'Hiện nay'} · {r.CongViec} · {r.DonViCongTac} · {r.ChucVu||'Không có chức vụ'}</p>):<p>Chưa kê khai.</p>}
  <p>Khen thưởng: {show(value.KhenThuong)}</p><p>Kỷ luật: {show(value.KyLuat)}</p>
  <h4>Gia đình</h4>{value.GiaDinh?.length?value.GiaDinh.map((r,i)=><article key={i}><strong>{relations[r.QuanHe]}: {r.HoTen||'Chưa có tên'}</strong><p>Năm sinh: {show(r.NamSinh)} · Tuổi: {show(r.Tuoi)} · Nghề nghiệp: {show(r.NgheNghiep)}</p><p>Nơi làm việc: {show(r.NoiLamViec)} · Nơi ở: {show(r.NoiOHienNay)}</p></article>):<p>Không có danh sách người thân được kê khai.</p>}
  <p>Ghi chú: {show(value.GhiChuGiaDinh)}</p><p>{value.GiaDinhDaKhaiBao?'Đã xác nhận kê khai gia đình.':'Chưa xác nhận kê khai gia đình.'} {value.CamDoan?'Đã cam đoan thông tin tự khai.':'Chưa xác nhận cam đoan.'}</p>
  <p>Dữ liệu tự khai không xác nhận thay cơ quan/địa phương. Bản có ảnh, chữ ký và xác nhận được đối chiếu từ tài liệu đính kèm.</p>
 </section>;
}
