import {describe,it,expect,vi} from 'vitest';
import {SqlStudiesRepository} from '../src/modules/studies/infrastructure/sql-studies.repository';

describe('Read-only student handover',()=>{
 it('rejects another person’s student ID before reading class assignments',async()=>{
  const db={query:vi.fn().mockResolvedValue({recordset:[]})};
  await expect(new SqlStudiesRepository(db as any).detail(19,'27')).rejects.toThrow('Không tìm thấy');
  expect(db.query).toHaveBeenCalledTimes(1);
  expect(db.query.mock.calls[0][1]).toEqual({HocVien:19,Nguoi:'27'});
 });
 it('returns only the owner profile and assigned classes without academic score fields',async()=>{
  const profile={MaHocVien:19,MaSoHocVien:'HV19'},classes=[{MaLopHocPhan:4,TenHocPhan:'Intro'}];
  const db={query:vi.fn().mockResolvedValueOnce({recordset:[profile]}).mockResolvedValueOnce({recordset:classes})};
  await expect(new SqlStudiesRepository(db as any).detail(19,'27')).resolves.toEqual({HocVien:profile,LopHocPhan:classes});
  expect(db.query.mock.calls.every(c=>c[1].Nguoi==='27')).toBe(true);
  expect(db.query.mock.calls[1][0]).toContain('h.MaNguoi=@Nguoi');
  expect(db.query.mock.calls.flatMap(c=>[c[0]]).join(' ')).not.toMatch(/DiemTongKet|DiemTrungBinh|TinChiTichLuy/);
 });
});
