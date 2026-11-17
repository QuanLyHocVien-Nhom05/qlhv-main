import 'reflect-metadata';
import {describe,it,expect,vi} from 'vitest';
import {resources,lookups} from '../src/modules/management/infrastructure/resources';
import {canReadResource,canWriteResource} from '../src/shared/security/roles';
import {SqlManagementRepository} from '../src/modules/management/infrastructure/sql-management.repository';
import {AdmissionJobs} from '../src/modules/admissions/infrastructure/admission-jobs.service';

describe('Recruitment scope and automation',()=>{
 it('removes legacy workflows from metadata, lookups and every staff role',()=>{
  for(const key of ['supervisors','topics','defenses','committee','grad-rules','language-evidence','graduation','grad-history','subscriptions','settings']){
   expect(resources.some(r=>r.key===key)).toBe(false);
   expect(lookups[key]).toBeUndefined();
   for(const role of ['ACADEMIC_ADMIN','OFFICER','LEADER','LECTURER']){
    expect(canReadResource([role],key)).toBe(false);
    for(const action of [null,'approve','edit','confirm'])expect(canWriteResource([role],key,action)).toBe(false);
   }
  }
 });
 it('keeps complete recruitment configuration and student handover available',()=>{
  for(const key of ['admission-batches','admission-quotas','admission-reasons','admission-report-templates','admission-enrollment-plans','admission-transfers','students','cohorts','classes'])expect(resources.some(r=>r.key===key)).toBe(true);
 });
 it('prevents manual student creation and academic grading while retaining handover reads',()=>{
  for(const key of ['students','registrations']){
   const resource=resources.find(r=>r.key===key)!;
   expect(resource.insert).toBeUndefined();
   expect(canWriteResource(['ACADEMIC_ADMIN'],key,null)).toBe(false);
  }
  const assignments=resources.find(r=>r.key==='registrations')!;
  expect(assignments.actions).toEqual([]);
  expect(assignments.query).not.toContain('DiemTongKet');
  for(const role of ['ACADEMIC_ADMIN','OFFICER','LECTURER'])expect(canWriteResource([role],'registrations','grade')).toBe(false);
 });
 it('scopes dashboard counts to the requesting unit and limits activity for non-admins',async()=>{
  const db={query:vi.fn().mockResolvedValue({recordsets:[[{HoSo:2}],[]]})};
  const repository=new SqlManagementRepository(db as any);
  await expect(repository.overview({sub:'21',roles:['OFFICER']})).resolves.toMatchObject({summary:{HoSo:2}});
  expect(db.query.mock.calls[0][1]).toEqual({Admin:false,Subject:'21'});
  expect(db.query.mock.calls[0][0]).toContain('fn_PhamViDonVi(@Subject)');
 });
 it('runs scheduled admissions before OCR and continues other jobs after one failure',async()=>{
  const jobs=new AdmissionJobs({} as any,{} as any,{} as any,{} as any,{} as any);
  const order:string[]=[];
  for(const name of ['processSchedule','processOcr','processScores','processNotice','processEnrollment'] as const)vi.spyOn(jobs,name).mockImplementation(async()=>{order.push(name);if(name==='processOcr')throw Error('OCR unavailable');});
  vi.spyOn((jobs as any).logger,'error').mockImplementation(()=>{});
  await jobs.tick();
  expect(order).toEqual(['processSchedule','processOcr','processScores','processNotice','processEnrollment']);
 });
});
