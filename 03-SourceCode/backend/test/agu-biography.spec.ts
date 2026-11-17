import 'reflect-metadata';
import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {ConfigService} from '@nestjs/config';
import {validateAguBiography,requireAguBiography,aguBiographySource} from '../src/modules/admissions/domain/agu-biography';
import {DataProtection} from '../src/shared/security/data-protection';
import {AdmissionsService} from '../src/modules/admissions/application/admissions.service';
const fixture=require('../scripts/agu-biography-fixture.cjs');
const birth='2000-01-01';

describe('Official AGU 2026 biography',()=>{
 it('pins the downloaded official Word template to its verified checksum',()=>{
  const original=readFileSync(resolve(process.cwd(),'../frontend/public'+aguBiographySource.localFile));
  expect(original.subarray(0,8).toString('hex')).toBe('d0cf11e0a1b11ae1');
  expect(createHash('sha256').update(original).digest('hex')).toBe(aguBiographySource.sha256);
  expect(aguBiographySource.sourceUrl).toMatch(/^https:\/\/tuyensinh\.agu\.edu\.vn\/uploads\//);
 });
 it('allows a partial draft but requires missing fields and declarations before submission',()=>{
  const draft=validateAguBiography({PhienBan:'AGU_2026',NoiSinh:' An Giang '},birth);
  expect(draft.NoiSinh).toBe('An Giang');expect(draft.CamDoan).toBe(false);
  expect(()=>requireAguBiography({NgaySinh:birth,SoYeuLyLich:draft})).toThrow('còn thiếu');
  expect(()=>requireAguBiography({NgaySinh:birth})).toThrow('Hoàn thiện');
  for(const overrides of [{CamDoan:false},{GiaDinhDaKhaiBao:false},{QuaTrinhHoatDong:[]}])expect(()=>requireAguBiography({NgaySinh:birth,SoYeuLyLich:fixture(overrides)})).toThrow();
 });
 it('preserves every family relation without requiring invented relatives for an empty family',()=>{
  const family=['CHA','ME','ANH_CHI_EM','VO_CHONG','CON'].map((QuanHe,i)=>({QuanHe,HoTen:'Người thân '+i,NamSinh:i===4?2023:1970+i,Tuoi:null,NgheNghiep:'',NoiLamViec:'',NoiOHienNay:'An Giang'}));
  expect(requireAguBiography({NgaySinh:birth,SoYeuLyLich:fixture({GiaDinh:family})}).GiaDinh).toHaveLength(5);
  expect(requireAguBiography({NgaySinh:birth,SoYeuLyLich:fixture()}).GiaDinh).toEqual([]);
  expect(()=>validateAguBiography(fixture({GiaDinh:[family[0],family[0]]}),birth)).toThrow('trùng');
 });
 it('rejects impossible/future dates, reversed activity periods and invalid numeric fields',()=>{
  for(const overrides of [{NgayVaoDoan:'2020-02-30'},{NgayVaoDang:'2999-01-01'},{NgayBatDauCongTac:'1999-01-01'},{NamTotNghiep:2999},{NamTotNghiep:2022.5},{SoNamCongTac:-1},{SoNamCongTac:'3'},{CamDoan:'true'}])expect(()=>validateAguBiography(fixture(overrides),birth)).toThrow();
  expect(()=>validateAguBiography(fixture({QuaTrinhHoatDong:[{TuThang:'2022-06',DenThang:'2020-01'}]}),birth)).toThrow('kết thúc');
  expect(()=>validateAguBiography(fixture({QuaTrinhHoatDong:[{TuThang:'2020-13'}]}),birth)).toThrow();
 });
 it('rejects additional fields, forged confirmation metadata and oversized repeating tables',()=>{
  for(const overrides of [{Approved:true},{PhienBan:'FAKE'},{GiaDinh:Array(21).fill({})},{QuaTrinhHoatDong:Array(21).fill({})},{GiaDinh:[{QuanHe:'CHA',HoTen:'Test',DaXacNhan:true}]}])expect(()=>validateAguBiography(fixture(overrides),birth)).toThrow();
 });
 it('uses the current date in Vietnam when UTC is still on the previous day',()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-16T19:00:00Z'));
  try{expect(()=>validateAguBiography(fixture({NgayBatDauCongTac:'2026-11-17'}),birth)).not.toThrow();expect(()=>validateAguBiography(fixture({NgayBatDauCongTac:'2026-11-18'}),birth)).toThrow();}finally{vi.useRealTimers();}
 });
 it('normalizes copies and encrypts the full family/activity payload with the existing profile context',()=>{
  const input=fixture(),copy=JSON.stringify(input),bio=validateAguBiography(input,birth);
  expect(JSON.stringify(input)).toBe(copy);
  const vault=new DataProtection(new ConfigService({DATA_ENCRYPTION_KEY:'ab'.repeat(32)}));
  const encrypted=vault.encode({SoYeuLyLich:bio},'admission-profile:21');
  expect(encrypted).not.toContain('An Giang');
  expect(vault.decode<any>(encrypted,'admission-profile:21').SoYeuLyLich).toEqual(bio);
  expect(()=>vault.decode(encrypted,'admission-profile:22')).toThrow();
 });
 it('blocks a draft submission with complete attachments but an incomplete biography',async()=>{
  const db={query:vi.fn()},service=new AdmissionsService(db as any,{} as any);
  vi.spyOn(service,'get').mockResolvedValue({TrangThai:'NHAP',TrangThaiDot:'DANG_MO',MoHoSo:new Date(Date.now()-60000),DongHoSo:new Date(Date.now()+60000),Version:'0x0000000000000001',profile:{NgaySinh:birth}} as any);
  vi.spyOn(service,'preScreen').mockResolvedValue({classification:'CAN_KIEM_TRA',warnings:[],missing:[],Version:'0x0000000000000001'});
  await expect(service.submit(1,'0x0000000000000001',{sub:'21',roles:['APPLICANT']})).rejects.toThrow('Hoàn thiện');
  expect(db.query).not.toHaveBeenCalled();
 });
});
