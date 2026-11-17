// Danh mục tuyển sinh và dữ liệu tối thiểu để bàn giao học viên (mục VIII).
const retainedResources = new Set([
  'units', 'faculties', 'majors', 'courses', 'course-versions', 'staff',
  'program-versions', 'students', 'cohorts', 'classes', 'registrations',
  'documents', 'audit',
  'admission-batches', 'admission-quotas', 'admission-certificates',
  'admission-major-rules', 'admission-rooms', 'admission-exams',
  'admission-examiners', 'admission-approval-rights', 'admission-outbox',
  'admission-transfers', 'admission-reasons', 'admission-report-templates',
  'admission-enrollment-plans', 'admission-councils', 'admission-council-members',
]);

export const resourceInScope = (key: string) => retainedResources.has(key);
