import { describe,it,expect,vi } from 'vitest';
import { RecoveryService } from '../src/modules/password-recovery/recovery.service';
import { recoveryHash } from '../src/modules/password-recovery/infrastructure/sql-recovery.repository';
describe('Recovery use cases',()=>{
 const setup=()=>{const repository={request:vi.fn(),list:vi.fn(),issue:vi.fn(),reject:vi.fn(),reset:vi.fn()};return {repository,service:new RecoveryService(repository)};};
 it('does not send mismatched/blank/oversized passwords to persistence',()=>{const {service,repository}=setup();for(const [pw,confirmation]of [['password1','password2'],['        ','        '],['a'.repeat(129),'a'.repeat(129)]])expect(()=>service.reset('code',pw,confirmation)).toThrow();expect(repository.reset).not.toHaveBeenCalled();});
 it('normalizes account identifiers and validates administrative IDs',()=>{const {service,repository}=setup();service.request(' USER ',' Test@Example.com ');expect(repository.request).toHaveBeenCalledWith('user','test@example.com');expect(()=>service.issue(0,'rev','user','note','1')).toThrow();expect(repository.issue).not.toHaveBeenCalled();});
 it('hashes high entropy tokens without storing their recoverable text',()=>{const a='A'.repeat(43),b='B'.repeat(43);expect(recoveryHash(a)).toMatch(/^[a-f0-9]{64}$/);expect(recoveryHash(a)).not.toContain(a);expect(recoveryHash(a)).not.toBe(recoveryHash(b));});
});
