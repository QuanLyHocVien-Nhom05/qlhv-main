'use client';
import {useEffect,useState} from 'react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api-client';
import {Dialog} from '@/components/academic/form-controls';
import {admissionDownload} from './admission-download';

type DemoPayment={MaGiaoDich:string;SoTien:number;LoaiPhi:string;TrangThai:string;KetQuaMoPhong:string|null;HanThanhToan:string;MaBienLai:string|null;qrDataUrl:string;message:string};
export function DemoPaymentDialog({id,code,token,onClose,onChanged}:{id:number;code:string;token:string;onClose:()=>void;onChanged:()=>void}){
 const [now,setNow]=useState(Date.now()),[downloadError,setDownloadError]=useState('');
 const endpoint=`/my/admissions/${id}/demo-payments/${code}`;
 const query=useQuery({queryKey:['demo-payment',id,code,token],queryFn:()=>api<DemoPayment>(endpoint,token),refetchInterval:5000});
 const mutation=useMutation({mutationFn:(KetQua:string)=>api<DemoPayment>(endpoint+'/result',token,'POST',{KetQua}),onSuccess:()=>{void query.refetch();onChanged();}});
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const payment=query.data,seconds=payment?Math.max(0,Math.ceil((Date.parse(payment.HanThanhToan)-now)/1000)):0;
 const pending=payment?.TrangThai==='CHO_TT',canAct=pending&&!mutation.isPending&&!query.error;
 async function receipt(){setDownloadError('');try{await admissionDownload(endpoint+'/receipt',token,'bien-lai-mo-phong.pdf');}catch(e){setDownloadError((e as Error).message);}}
 return <Dialog title="Thanh toán QR mô phỏng" onClose={onClose}><div className="drawer-body">
  <p className="info-note" role="note"><strong>ĐỒ ÁN — KHÔNG CHUYỂN TIỀN THẬT.</strong> QR chỉ chứa thông tin giao dịch thử, không phải mã chuyển khoản ngân hàng. Mọi kết quả bên dưới đều là mô phỏng.</p>
  {query.isPending&&<p>Đang tạo mã QR…</p>}{query.error&&<p className="error" role="alert">{query.error.message}</p>}
  {payment&&<><div style={{textAlign:'center'}}><img src={payment.qrDataUrl} alt="Mã QR thông tin giao dịch mô phỏng, không chuyển tiền thật" width={280} height={280} style={{maxWidth:'100%',height:'auto'}}/></div>
   <dl className="record-details"><div><dt>Mã giao dịch</dt><dd style={{overflowWrap:'anywhere'}}>{payment.MaGiaoDich}</dd></div><div><dt>Khoản phí</dt><dd>{payment.LoaiPhi==='XET_TUYEN'?'Lệ phí dự tuyển':'Phí nhập học'}</dd></div><div><dt>Số tiền mô phỏng</dt><dd>{Number(payment.SoTien).toLocaleString('vi-VN')} đ</dd></div><div><dt>Hạn thanh toán</dt><dd>{new Date(payment.HanThanhToan).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</dd></div></dl>
   {pending&&<p role="timer">Còn {Math.floor(seconds/60)} phút {seconds%60} giây.{seconds===0?' Mã đã hết hạn, đang cập nhật kết quả.':''}</p>}
   <p className={payment.TrangThai==='DA_TT'?'success-note':'info-note'} role="status">{payment.message}</p>
   {payment.MaBienLai&&<p style={{overflowWrap:'anywhere'}}>Biên lai mô phỏng: {payment.MaBienLai}</p>}
   {pending&&<div className="button-row"><button disabled={!canAct||seconds===0} onClick={()=>mutation.mutate('THANH_CONG')}>Mô phỏng thanh toán thành công</button><button className="secondary" disabled={!canAct} onClick={()=>mutation.mutate('THAT_BAI')}>Mô phỏng thất bại</button><button className="secondary" disabled={!canAct} onClick={()=>mutation.mutate('HET_HAN')}>Mô phỏng hết hạn</button></div>}
   {payment.TrangThai==='DA_TT'&&<button className="secondary" onClick={()=>void receipt()}>Tải biên lai mô phỏng PDF</button>}
  </>}
  {mutation.error&&<p className="error" role="alert">{mutation.error.message}</p>}{downloadError&&<p className="error" role="alert">{downloadError}</p>}
  <button className="secondary" onClick={onClose}>Đóng thanh toán mô phỏng</button>
 </div></Dialog>;
}
