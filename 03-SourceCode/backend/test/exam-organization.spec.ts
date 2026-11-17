import {describe,it,expect} from 'vitest';
import {validateSbdTemplate} from '../src/modules/admissions/application/exam-organization.service';
describe('Exam number templates',()=>{
 it('allows batch, year, major and padded identifiers',()=>{expect(()=>validateSbdTemplate('{DOT}-{NAM}-{SO}',7)).not.toThrow();expect(()=>validateSbdTemplate('{DOT}-{NGANH}-{SO}',7)).not.toThrow();});
 it('rejects ambiguous numbers, unknown tokens, truncation widths and excessive output',()=>{
  for(const [template,width] of [['{SO}',7],['{DOT}-{SO}-{SO}',7],['{DOT}-{EMAIL}-{SO}',7],['{DOT}-{SO}',0],['{DOT}-{SO}',16],['{DOT}-{DOT}-{SO}',7],['{DOT}/../{SO}',7]] as [string,number][])expect(()=>validateSbdTemplate(template,width)).toThrow();
 });
});
