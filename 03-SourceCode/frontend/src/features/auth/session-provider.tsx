'use client';
import { createContext,useCallback,useContext,useEffect,useState,type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@/types/academic';
type SessionState={session:Session|null;setSession:(session:Session|null)=>void;notice:string;setNotice:(message:string)=>void;loginHint:string;setLoginHint:(username:string)=>void;logout:(message?:string)=>void};
const Context=createContext<SessionState|null>(null);
export function SessionProvider({children}:{children:ReactNode}) {
  const [session,updateSession]=useState<Session|null>(null);const [notice,setNotice]=useState('');const [loginHint,setLoginHint]=useState('');const client=useQueryClient();
  const setSession=useCallback((value:Session|null)=>{client.clear();updateSession(value);setNotice('');},[client]);
  const logout=useCallback((message='')=>{if(session?.accessToken)void fetch(`${process.env.NEXT_PUBLIC_API_URL??'http://localhost:3001/api'}/auth/logout`,{method:'POST',headers:{Authorization:'Bearer '+session.accessToken}}).catch(()=>{});updateSession(null);setNotice(message);client.clear();},[client,session]);
  useEffect(()=>{const expired=()=>logout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');window.addEventListener('qlhv-session-expired',expired);return()=>window.removeEventListener('qlhv-session-expired',expired);},[logout]);
  return <Context.Provider value={{session,setSession,notice,setNotice,loginHint,setLoginHint,logout}}>{children}</Context.Provider>;
}
export function useSession() {const context=useContext(Context);if(!context)throw new Error('SessionProvider is required');return context;}
export function accountDestination(session:Session) {return session.user.roles.includes('APPLICANT')?'/tuyen-sinh':session.user.roles.some(r=>['ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER'].includes(r))?'/quan-tri':'/tai-khoan';}
