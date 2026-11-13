import { randomUUID } from 'node:crypto';

export class BusinessError extends Error {
  constructor(message: string, public readonly kind: 'invalid' | 'conflict' | 'missing' = 'invalid') { super(message); }
}
export type Course = {
  code: string; name: string; credits: number; semester: number;
  required: boolean; prerequisites: string[];
};
export type Version = {
  id: string; number: number; cohort: string; requiredCredits: number;
  status: 'DRAFT' | 'APPROVED'; courses: Course[]; approvedBy?: string; approvedAt?: string;
};
export type Program = { id: string; code: string; name: string; revision: number; versions: Version[] };
export type VersionInput = Pick<Version, 'cohort' | 'requiredCredits' | 'courses'>;

export function validateCurriculum(input: VersionInput, approving = false): void {
  if (!input.cohort.trim() || !Number.isInteger(input.requiredCredits) || input.requiredCredits < 1)
    throw new BusinessError('Khóa tuyển sinh và số tín chỉ yêu cầu không hợp lệ.');
  const courses = new Map(input.courses.map(c => [c.code, c]));
  if (courses.size !== input.courses.length) throw new BusinessError('Mã học phần bị trùng.');
  for (const c of input.courses) {
    if (!/^[A-Z0-9_-]+$/.test(c.code) || !c.name.trim() || !Number.isInteger(c.credits) || c.credits < 1 || c.credits > 30
        || !Number.isInteger(c.semester) || c.semester < 1 || c.semester > 20)
      throw new BusinessError('Thông tin học phần không hợp lệ.');
    if (new Set(c.prerequisites).size !== c.prerequisites.length) throw new BusinessError('Học phần tiên quyết bị trùng.');
    for (const code of c.prerequisites) {
      const prerequisite = courses.get(code);
      if (!prerequisite || code === c.code) throw new BusinessError('Học phần tiên quyết không tồn tại hoặc tự tham chiếu.');
      if (prerequisite.semester >= c.semester) throw new BusinessError('Học phần tiên quyết phải ở học kỳ trước.');
      if (c.required && !prerequisite.required) throw new BusinessError('Tiên quyết của học phần bắt buộc phải là học phần bắt buộc.');
    }
  }
  const total = input.courses.reduce((s, c) => s + c.credits, 0);
  const mandatory = input.courses.filter(c => c.required).reduce((s, c) => s + c.credits, 0);
  if (mandatory > input.requiredCredits) throw new BusinessError('Tín chỉ bắt buộc vượt tổng tín chỉ yêu cầu.');
  if (approving && total < input.requiredCredits) throw new BusinessError('Khung chương trình chưa đủ tín chỉ để phê duyệt.');
}

export function createProgram(code: string, name: string, input: VersionInput): Program {
  if (!/^[A-Z0-9_-]{1,30}$/.test(code) || !name.trim() || name.length > 200) throw new BusinessError('Mã hoặc tên chương trình không hợp lệ.');
  validateCurriculum(input);
  return { id: randomUUID(), code, name: name.trim(), revision: 0, versions: [{ ...structuredClone(input), cohort: input.cohort.trim(), id: randomUUID(), number: 1, status: 'DRAFT' }] };
}
export function getVersion(program: Program, id: string): Version {
  const version = program.versions.find(v => v.id === id);
  if (!version) throw new BusinessError('Không tìm thấy phiên bản.', 'missing');
  return version;
}
export function updateVersion(program: Program, id: string, input: VersionInput): void {
  const version = getVersion(program, id);
  if (version.status !== 'DRAFT') throw new BusinessError('Phiên bản đã phê duyệt bị khóa; hãy tạo phiên bản mới.', 'conflict');
  validateCurriculum(input);
  if (program.versions.some(v => v.id !== id && v.cohort === input.cohort.trim())) throw new BusinessError('Khóa tuyển sinh đã tồn tại.', 'conflict');
  Object.assign(version, structuredClone(input), {cohort: input.cohort.trim()});
}
export function cloneVersion(program: Program, sourceId: string, cohort: string): Version {
  const source = getVersion(program, sourceId);
  cohort = cohort.trim();
  if (!cohort || program.versions.some(v => v.cohort === cohort)) throw new BusinessError('Khóa tuyển sinh trống hoặc đã tồn tại.', 'conflict');
  const version: Version = {
    id: randomUUID(), number: Math.max(...program.versions.map(v => v.number)) + 1,
    cohort, requiredCredits: source.requiredCredits, courses: structuredClone(source.courses), status: 'DRAFT',
  };
  program.versions.push(version);
  return version;
}
export function approveVersion(program: Program, id: string, actor: string): void {
  const version = getVersion(program, id);
  if (version.status !== 'DRAFT') throw new BusinessError('Phiên bản đã được phê duyệt.', 'conflict');
  validateCurriculum(version, true);
  version.status = 'APPROVED'; version.approvedBy = actor; version.approvedAt = new Date().toISOString();
}
