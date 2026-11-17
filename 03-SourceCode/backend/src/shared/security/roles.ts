import {resourceInScope} from './application-scope';
export const accountRoles=['ADMIN','LANH_DAO','CAN_BO','GIANG_VIEN','USER','THI_SINH'] as const;
export type AccountRole=typeof accountRoles[number];
export function sessionRole(role:string){return ({ADMIN:'ACADEMIC_ADMIN',USER:'STUDENT',LANH_DAO:'LEADER',CAN_BO:'OFFICER',GIANG_VIEN:'LECTURER',THI_SINH:'APPLICANT'} as Record<string,string>)[role];}
export const staffRoles=['ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER'];
export function canReadResource(roles:string[],key:string){
 if(!resourceInScope(key))return false;
 if(roles.includes('ACADEMIC_ADMIN'))return true;
 if(key==='admission-approval-rights')return false;
 if(key==='audit')return false;
 if(roles.some(r=>['LEADER','OFFICER'].includes(r)))return true;
 return roles.includes('LECTURER')&&['program-versions','courses','course-versions','classes','registrations'].includes(key);
}
export function canWriteResource(roles:string[],key:string,action:string|null){
 if(!resourceInScope(key))return false;
 if(key==='registrations'||key==='students'&&action!=='cohort')return false;
 if(roles.includes('ACADEMIC_ADMIN'))return true;
 if(key==='admission-report-templates')return action==='approve'?roles.includes('LEADER'):roles.includes('OFFICER');
 if(key==='admission-approval-rights')return false;
 if(roles.includes('LEADER'))return false;
 if(key.startsWith('admission-'))return roles.includes('OFFICER')&&!['delete','retry'].includes(action??'')&&key!=='admission-outbox';
 if(roles.includes('OFFICER'))return !['audit','settings','staff'].includes(key)&&!['approve','confirm','adjust','delete'].includes(action??'');
 return false;
}
