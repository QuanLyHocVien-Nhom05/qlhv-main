export const roleLabels:Record<string,string>={ACADEMIC_ADMIN:'Quản trị viên',LEADER:'Lãnh đạo',OFFICER:'Cán bộ đào tạo',LECTURER:'Giảng viên',STUDENT:'Học viên',APPLICANT:'Thí sinh'};
export function workspaceRole(roles:string[]){return roles.some(r=>['ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER'].includes(r));}
export function programPermission(roles:string[]){return {edit:roles.some(r=>['ACADEMIC_ADMIN','OFFICER'].includes(r)),approve:roles.some(r=>['ACADEMIC_ADMIN','LEADER'].includes(r))};}
