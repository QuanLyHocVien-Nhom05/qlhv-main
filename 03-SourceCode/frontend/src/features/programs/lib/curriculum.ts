import type { CurriculumCourse, CurriculumInput } from '@/types/academic';

export function removeCourse(courses: CurriculumCourse[], index: number): CurriculumCourse[] {
  const removed = courses[index]?.MaHocPhan;
  const remaining = courses.filter((_, position) => position !== index);
  if (!removed || remaining.some(course => course.MaHocPhan === removed)) return remaining;
  return remaining.map(course => ({...course, TienQuyet: course.TienQuyet.filter(id => id !== removed)}));
}

export function changeCourse(courses: CurriculumCourse[], index: number, patch: Partial<CurriculumCourse>): CurriculumCourse[] {
  const previous = courses[index]?.MaHocPhan;
  const changed = courses.map((course, position) => position === index ? {...course, ...patch} : course);
  if (patch.MaHocPhan === undefined || patch.MaHocPhan === previous) return changed;
  return changed.map((course, position) => ({...course, TienQuyet: course.TienQuyet.filter(id =>
    id !== course.MaHocPhan && (id !== previous || changed.some(other => other.MaHocPhan === previous))
  )}));
}

export function curriculumIssues(input: CurriculumInput): string[] {
  const issues = new Set<string>();
  const courses = new Map(input.HocPhan.filter(course => course.MaHocPhan > 0).map(course => [course.MaHocPhan, course]));
  if (courses.size !== input.HocPhan.filter(course => course.MaHocPhan > 0).length) issues.add('Một học phần chỉ được xuất hiện một lần trong khung.');
  input.HocPhan.forEach((course, index) => {
    if (!course.MaHocPhan) issues.add(`Hãy chọn học phần ở dòng ${index + 1}.`);
    if (!Number.isInteger(course.SoTinChi) || course.SoTinChi < 1 || course.SoTinChi > 30) issues.add(`Tín chỉ dòng ${index + 1} phải từ 1 đến 30.`);
    if (!Number.isInteger(course.HocKyDuKien) || course.HocKyDuKien < 1 || course.HocKyDuKien > 20) issues.add(`Học kỳ dòng ${index + 1} phải từ 1 đến 20.`);
    course.TienQuyet.forEach(id => {
      const prerequisite = courses.get(id);
      if (!prerequisite) issues.add('Có học phần tiên quyết không còn trong khung.');
      else if (prerequisite.HocKyDuKien >= course.HocKyDuKien) issues.add('Học phần tiên quyết phải nằm ở học kỳ trước.');
      if (course.BatBuoc && prerequisite && !prerequisite.BatBuoc) issues.add('Tiên quyết của học phần bắt buộc cũng phải là học phần bắt buộc.');
    });
  });
  if (input.HocPhan.filter(course => course.BatBuoc).reduce((sum, course) => sum + course.SoTinChi, 0) > input.TinChiToiThieu)
    issues.add('Tín chỉ bắt buộc đang vượt tín chỉ yêu cầu của chương trình.');
  return [...issues];
}

export function editableVersion(version: CurriculumInput): CurriculumInput {
  return {
    KhoaTuyenSinh:version.KhoaTuyenSinh,TinChiToiThieu:version.TinChiToiThieu,
    DiemDatHocPhan:version.DiemDatHocPhan,DiemTrungBinhToiThieu:version.DiemTrungBinhToiThieu,
    ThoiGianToiDaThang:version.ThoiGianToiDaThang,
    HocPhan:version.HocPhan.map(course => ({
      MaHocPhan:course.MaHocPhan,SoTinChi:course.SoTinChi,HocKyDuKien:course.HocKyDuKien,
      BatBuoc:course.BatBuoc,TienQuyet:[...course.TienQuyet],
    })),
  };
}
