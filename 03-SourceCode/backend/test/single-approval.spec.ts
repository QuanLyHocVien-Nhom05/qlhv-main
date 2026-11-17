import {describe,it,expect,vi} from 'vitest';
import {ConfigService} from '@nestjs/config';
import {DataProtection} from '../src/shared/security/data-protection';
import {AdmissionsService} from '../src/modules/admissions/application/admissions.service';
import {rankCandidates} from '../src/modules/admissions/domain/admission';
const scores={CoSo:8,ChuyenNganh:8,NgoaiNgu:6,UuTien:0,Tong:22,Gpa:8};
describe('Single approval and documented tie decisions',()=>{
 it('requires the entire boundary group without duplicates or unrelated candidates',()=>{
  const rows=[1,2,3].map(id=>({MaHoSo:id,SoHoSo:'HS'+id,scores}));
  for(const order of [[],[2,1],[1,1,2],[2,1,4]])expect(()=>rankCandidates(rows,'GPA',1,0,order)).toThrow();
  expect(rankCandidates(rows,'GPA',1,0,[3,2,1]).map(r=>[r.MaHoSo,r.selected])).toEqual([[3,true],[2,false],[1,false]]);
 });
 it('never uses a manual decision to override total score or the configured floor',()=>{
  const rows=[{MaHoSo:1,SoHoSo:'HS1',scores:{...scores,Tong:25}},{MaHoSo:2,SoHoSo:'HS2',scores}];
  expect(rankCandidates(rows,'GPA',1,24,[2,1])[0].MaHoSo).toBe(1);
  expect(rankCandidates(rows,'GPA',1,26,[2,1]).every(r=>!r.selected)).toBe(true);
 });
 it('rechecks encrypted scores before allowing a forged selection to be approved',async()=>{
  const vault=new DataProtection(new ConfigService({DATA_ENCRYPTION_KEY:'ab'.repeat(32)}));
  const query=vi.fn().mockResolvedValueOnce({recordset:[{Allowed:1}]}).mockResolvedValueOnce({recordset:[{Allowed:1,TrangThai:'CHO_DUYET'}]}).mockResolvedValueOnce({recordset:[{MaChiTieu:1,TieuChiPhu:'GPA',SoLuong:1,DiemSan:25}]}).mockResolvedValueOnce({recordset:[{MaHoSo:1,SoHoSo:'HS1',DiemMaHoa:vault.encode(scores,'admission-scores:1'),XepHang:1,DuKienTrungTuyen:true,ScoreVersion:'0x0000000000000001'}]});
  const service=new AdmissionsService({query} as any,vault);
  await expect(service.approve(1,'Final approval',{sub:'1',roles:['ACADEMIC_ADMIN']})).rejects.toThrow('không khớp');
  expect(query).toHaveBeenCalledTimes(4);
 });
});
