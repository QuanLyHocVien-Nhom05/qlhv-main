export const accountRoles=['ADMIN','LANH_DAO','CAN_BO','GIANG_VIEN','USER','THI_SINH'] as const;
export type AccountRole=typeof accountRoles[number];
export function sessionRole(role:string){return ({ADMIN:'ACADEMIC_ADMIN',USER:'STUDENT',LANH_DAO:'LEADER',CAN_BO:'OFFICER',GIANG_VIEN:'LECTURER',THI_SINH:'APPLICANT'} as Record<string,string>)[role];}
export const staffRoles=['ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER'];
export function canReadResource(roles:string[],key:string){
 if(roles.includes('ACADEMIC_ADMIN'))return true;
 if(key==='admission-approval-rights')return false;
 if(['audit','settings','subscriptions'].includes(key))return roles.includes('OFFICER')&&key==='subscriptions';
 if(roles.some(r=>['LEADER','OFFICER'].includes(r)))return true;
 return roles.includes('LECTURER')&&['supervisors','program-versions','courses','course-versions','classes','registrations','topics','defenses','committee'].includes(key);
}
export function canWriteResource(roles:string[],key:string,action:string|null){
 if(roles.includes('ACADEMIC_ADMIN'))return true;
 if(key==='admission-report-templates')return action==='approve'?roles.includes('LEADER'):roles.includes('OFFICER');
 if(key==='admission-approval-rights')return false;
 if(roles.includes('LEADER'))return !!action&&(['topics','defenses'].includes(key)&&action==='approve'||key==='graduation'&&action==='confirm');
 if(key.startsWith('admission-'))return roles.includes('OFFICER')&&!['publish-scores','delete','retry'].includes(action??'')&&key!=='admission-outbox';
 if(roles.includes('OFFICER'))return !['audit','settings','staff'].includes(key)&&!['approve','confirm','adjust','delete'].includes(action??'');
 return roles.includes('LECTURER')&&(key==='registrations'&&action==='grade'||key==='topics'&&action==='progress');
}
