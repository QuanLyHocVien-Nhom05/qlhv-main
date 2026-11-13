const {test}=require('node:test');
const assert=require('node:assert/strict');
const {removeCourse,changeCourse,curriculumIssues}=require('../src/features/programs/lib/curriculum.ts');
const courses=()=>[
  {MaHocPhan:1,SoTinChi:3,HocKyDuKien:1,BatBuoc:true,TienQuyet:[]},
  {MaHocPhan:2,SoTinChi:3,HocKyDuKien:2,BatBuoc:true,TienQuyet:[1]},
];
test('removing or changing a course clears orphan prerequisites without mutating the saved snapshot',()=>{
  const original=courses();
  const removed=removeCourse(original,0);
  assert.deepEqual(removed[0].TienQuyet,[]);
  const changed=changeCourse(original,0,{MaHocPhan:3});
  assert.deepEqual(changed[1].TienQuyet,[]);
  assert.deepEqual(original,courses());
});
test('duplicate courses, backward prerequisites and excess compulsory credits are rejected',()=>{
  assert.match(curriculumIssues({HocPhan:[courses()[0],courses()[0]],TinChiToiThieu:6}).join(' '),/một lần/);
  const backward=courses();backward[0].HocKyDuKien=2;
  assert.match(curriculumIssues({HocPhan:backward,TinChiToiThieu:6}).join(' '),/học kỳ trước/);
  assert.match(curriculumIssues({HocPhan:courses(),TinChiToiThieu:3}).join(' '),/vượt/);
});
test('incomplete total credits remain valid for a draft and unchanged valid curricula have no issues',()=>{
  assert.deepEqual(curriculumIssues({HocPhan:courses(),TinChiToiThieu:9}),[]);
  assert.deepEqual(curriculumIssues({HocPhan:courses(),TinChiToiThieu:6}),[]);
});
