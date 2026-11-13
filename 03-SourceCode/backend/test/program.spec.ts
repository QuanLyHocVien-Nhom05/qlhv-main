import { describe, expect, it } from 'vitest';
import { approveVersion, cloneVersion, createProgram, updateVersion, validateCurriculum, type VersionInput } from '../src/modules/programs/domain/program';
const input = (): VersionInput => ({cohort:'2026',requiredCredits:6,courses:[
  {code:'CS01',name:'Nền tảng',credits:3,semester:1,required:true,prerequisites:[]},
  {code:'CS02',name:'Nâng cao',credits:3,semester:2,required:true,prerequisites:['CS01']},
]});
describe('Curriculum business rules', () => {
  it('locks an approved version and keeps the original unchanged when cloning', () => {
    const program = createProgram('CS', 'Khoa học máy tính', input());
    const original = program.versions[0]; approveVersion(program, original.id, 'approver');
    const snapshot = structuredClone(original);
    expect(() => updateVersion(program, original.id, input())).toThrow(/bị khóa/);
    const clone = cloneVersion(program, original.id, '2027');
    clone.courses[0].name = 'Đã sửa';
    expect(original).toEqual(snapshot); expect(clone.status).toBe('DRAFT');
    expect(clone.approvedBy).toBeUndefined(); expect(clone.number).toBe(2);
  });
  it('rejects duplicate courses, absent prerequisites and backwards prerequisite cycles', () => {
    const duplicate = input(); duplicate.courses.push(duplicate.courses[0]);
    expect(() => validateCurriculum(duplicate)).toThrow(/trùng/);
    const missing = input(); missing.courses[1].prerequisites = ['UNKNOWN'];
    expect(() => validateCurriculum(missing)).toThrow(/không tồn tại/);
    const cycle = input(); cycle.courses[0].prerequisites = ['CS02'];
    expect(() => validateCurriculum(cycle)).toThrow(/học kỳ trước/);
  });
  it('allows incomplete drafts but refuses their approval', () => {
    const draft = input(); draft.requiredCredits = 9;
    const program = createProgram('CS','CNTT',draft);
    expect(() => approveVersion(program,program.versions[0].id,'approver')).toThrow(/chưa đủ/);
    expect(program.versions[0].status).toBe('DRAFT');
  });
  it('rejects mandatory credits exceeding the target', () => {
    const draft = input(); draft.requiredCredits = 3;
    expect(() => validateCurriculum(draft)).toThrow(/vượt/);
  });
  it('rejects duplicate cohorts and repeated approval', () => {
    const program = createProgram('CS','CNTT',input());
    expect(() => cloneVersion(program,program.versions[0].id,'2026')).toThrow(/đã tồn tại/);
    approveVersion(program,program.versions[0].id,'approver');
    expect(() => approveVersion(program,program.versions[0].id,'approver')).toThrow(/đã được/);
  });
});
