'use client';
import { useState,type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye,EyeOff,KeyRound } from 'lucide-react';
import { Dialog } from '@/components/academic/form-controls';
import { api } from '@/lib/api-client';

export function ChangePasswordDialog({token,onClose,onChanged}:{token:string;onClose:()=>void;onChanged:(message:string)=>void}) {
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [visible,setVisible]=useState(false);
  const [validation,setValidation]=useState('');
  const mutation=useMutation({mutationFn:()=>api<{message:string}>('/auth/change-password',token,'POST',{currentPassword,newPassword,confirmPassword}),onSuccess:result=>onChanged(result.message)});
  function submit(event:FormEvent) {
    event.preventDefault();mutation.reset();
    if(newPassword!==confirmPassword){setValidation('Xác nhận mật khẩu mới không khớp.');return;}
    if(newPassword.trim().length<8){setValidation('Mật khẩu mới phải có ít nhất 8 ký tự, không chỉ gồm khoảng trắng.');return;}
    if(newPassword===currentPassword){setValidation('Mật khẩu mới phải khác mật khẩu hiện tại.');return;}
    setValidation('');mutation.mutate();
  }
  const fields=[{id:'current-password',label:'Mật khẩu hiện tại',value:currentPassword,set:setCurrentPassword,autocomplete:'current-password'},
    {id:'new-password',label:'Mật khẩu mới',value:newPassword,set:setNewPassword,autocomplete:'new-password'},
    {id:'confirm-password',label:'Xác nhận mật khẩu mới',value:confirmPassword,set:setConfirmPassword,autocomplete:'new-password'}];
  return <Dialog title="Đổi mật khẩu" onClose={()=>!mutation.isPending&&onClose()}><form className="drawer-body" onSubmit={submit}>
    <div className="info-note"><KeyRound size={22}/><p>Sau khi đổi mật khẩu, các phiên đăng nhập cũ sẽ kết thúc. Hãy đăng nhập lại bằng mật khẩu mới.</p></div>
    <fieldset disabled={mutation.isPending}>{fields.map(field=><label key={field.id} htmlFor={field.id}>{field.label}<input id={field.id} type={visible?'text':'password'} autoComplete={field.autocomplete} required minLength={field.id==='current-password'?1:8} maxLength={field.id==='current-password'?200:128} value={field.value} onChange={event=>{field.set(event.target.value);setValidation('');mutation.reset();}}/></label>)}
      <p className="field-hint">Mật khẩu mới có từ 8 đến 128 ký tự và khác mật khẩu hiện tại.</p>
      <button type="button" className="text-button" aria-pressed={visible} onClick={()=>setVisible(value=>!value)}>{visible?<EyeOff size={15}/>:<Eye size={15}/>} {visible?'Ẩn mật khẩu':'Hiện mật khẩu'}</button>
      {(validation||mutation.error)&&<p className="error" role="alert">{validation||mutation.error?.message}</p>}
      <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Hủy</button><button disabled={mutation.isPending}><KeyRound size={16}/>{mutation.isPending?'Đang đổi mật khẩu…':'Lưu mật khẩu mới'}</button></div>
    </fieldset></form></Dialog>;
}
