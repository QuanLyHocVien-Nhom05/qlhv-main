'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {apiBase} from '@/lib/api-client';
import type {Session} from '@/types/academic';

type SessionState={session:Session|null;setSession:(session:Session|null)=>void;notice:string;setNotice:(message:string)=>void;loginHint:string;setLoginHint:(username:string)=>void;logout:(message?:string)=>Promise<void>};
const Context=createContext<SessionState|null>(null);
const storageKey='qlhv.access-token';
function storeToken(token:string|null){try{if(token)sessionStorage.setItem(storageKey,token);else sessionStorage.removeItem(storageKey);}catch{/* Storage may be unavailable; the current in-memory session still works. */}}
function readToken(){try{return sessionStorage.getItem(storageKey);}catch{return null;}}
function expiration(token:string){try{const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return typeof payload.exp==='number'&&Number.isFinite(payload.exp)?payload.exp*1000:null;}catch{return null;}}

export function SessionProvider({children}:{children:ReactNode}){
  const [session,updateSession]=useState<Session|null>(null),[notice,setNotice]=useState(''),[loginHint,setLoginHint]=useState('');
  const [restoring,setRestoring]=useState(true),[restoreError,setRestoreError]=useState(''),[leaving,setLeaving]=useState(false);
  const client=useQueryClient(),tokenRef=useRef<string|null>(null),revision=useRef(0),logoutRequest=useRef<Promise<void>|null>(null);

  const clearLocal=useCallback((message='')=>{
    revision.current++;tokenRef.current=null;storeToken(null);updateSession(null);setNotice(message);setRestoring(false);setRestoreError('');client.clear();
  },[client]);
  const setSession=useCallback((value:Session|null)=>{
    revision.current++;tokenRef.current=value?.accessToken??null;storeToken(tokenRef.current);client.clear();updateSession(value);setNotice('');setRestoring(false);setRestoreError('');
  },[client]);

  const restore=useCallback(async(signal?:AbortSignal)=>{
    const current=++revision.current,token=readToken();setRestoring(true);setRestoreError('');
    if(!token){clearLocal();return;}
    tokenRef.current=token;
    const active=()=>!signal?.aborted&&revision.current===current;
    try{
      const timeout=AbortSignal.timeout(10000);
      const response=await fetch(apiBase()+'/auth/me',{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:signal?AbortSignal.any([signal,timeout]):timeout});
      if(!active())return;
      if(response.status===401||response.status===403){clearLocal('Phiên đăng nhập đã hết hạn hoặc quyền đã thay đổi. Vui lòng đăng nhập lại.');return;}
      if(!response.ok)throw Error('Không xác minh được phiên đăng nhập.');
      const user=await response.json() as Session['user'];
      if(!user||!['string','number'].includes(typeof user.id)||typeof user.name!=='string'||!Array.isArray(user.roles)||user.roles.length!==1||!['ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER','APPLICANT','STUDENT'].includes(user.roles[0]))throw Error('Thông tin phiên không hợp lệ.');
      if(active()){client.clear();updateSession({accessToken:token,user});setNotice('');}
    }catch{if(active())setRestoreError('Chưa kết nối được máy chủ để khôi phục phiên đăng nhập. Hãy thử lại.');}
    finally{if(active())setRestoring(false);}
  },[clearLocal,client]);

  const logout=useCallback((message=''):Promise<void>=>{
    if(logoutRequest.current)return logoutRequest.current;
    const token=tokenRef.current;clearLocal(message);if(!token)return Promise.resolve();
    setLeaving(true);
    const request=fetch(apiBase()+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)}).then(()=>{}).catch(()=>{}).finally(()=>{logoutRequest.current=null;setLeaving(false);});
    logoutRequest.current=request;return request;
  },[clearLocal]);

  useEffect(()=>{const controller=new AbortController();void restore(controller.signal);return()=>controller.abort();},[restore]);
  useEffect(()=>{
    const expired=(event:Event)=>{if((event as CustomEvent<{token?:string}>).detail?.token===tokenRef.current&&tokenRef.current)clearLocal('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');};
    window.addEventListener('qlhv-session-expired',expired);return()=>window.removeEventListener('qlhv-session-expired',expired);
  },[clearLocal]);
  useEffect(()=>{
    if(!session)return;const deadline=expiration(session.accessToken);if(deadline===null)return;const token=session.accessToken;
    const expire=()=>{if(tokenRef.current===token)clearLocal('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');};
    if(deadline<=Date.now()){expire();return;}
    const timer=setTimeout(expire,Math.min(deadline-Date.now(),2147483647));return()=>clearTimeout(timer);
  },[session,clearLocal]);

  return <Context.Provider value={{session,setSession,notice,setNotice,loginHint,setLoginHint,logout}}>
    {restoring||leaving?<main className="session-status" aria-busy="true"><p role="status">{leaving?'Đang đăng xuất…':'Đang khôi phục phiên đăng nhập…'}</p></main>:restoreError?<main className="session-status"><h1>Khôi phục phiên đăng nhập</h1><p role="alert">{restoreError}</p><div className="button-row"><button type="button" onClick={()=>void restore()}>Thử lại</button><button type="button" className="secondary" onClick={()=>void logout()}>Đăng xuất</button></div></main>:children}
  </Context.Provider>;
}
export function useSession(){const context=useContext(Context);if(!context)throw new Error('SessionProvider is required');return context;}
export function accountDestination(session:Session){return session.user.roles.includes('APPLICANT')?'/tuyen-sinh':session.user.roles.some(r=>['ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER'].includes(r))?'/quan-tri':'/tai-khoan';}
