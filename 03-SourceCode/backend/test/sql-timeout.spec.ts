import { describe,it,expect } from 'vitest';
import { sqlRequestTimeout } from '../src/shared/infrastructure/sql-timeout';
describe('SQL request timeout configuration',()=>{
 it('keeps a finite default and permits a longer timeout for an overloaded local test server',()=>{expect(sqlRequestTimeout()).toBe(30000);expect(sqlRequestTimeout('60000')).toBe(60000);});
 it('rejects disabled, fractional, malformed and excessive timeouts',()=>{for(const value of ['', '0','-1','1.5','1500ms','Infinity','120001'])expect(()=>sqlRequestTimeout(value)).toThrow();});
});
