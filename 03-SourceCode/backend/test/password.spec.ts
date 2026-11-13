import 'reflect-metadata';
import { describe,it,expect,vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { hashPassword,verifyPassword } from '../src/modules/auth/password';
import { LocalAccountService } from '../src/modules/auth/local-account.service';
describe('Password storage and change policy',()=>{
  it('uses independent salts and preserves exact unicode passwords',async()=>{
    const password='Mật khẩu thử 2026!';
    const first=await hashPassword(password),second=await hashPassword(password);
    expect(first).not.toContain(password);expect(first).not.toBe(second);
    expect(await verifyPassword(password,first)).toBe(true);
    expect(await verifyPassword(password+' ',first)).toBe(false);
    expect(await verifyPassword(password,'not-a-hash')).toBe(false);
  });
  it('rejects mismatched, blank and unchanged new passwords without writing',async()=>{
    const db={query:vi.fn()};const service=new LocalAccountService(new ConfigService(),db as any);
    await expect(service.changePassword('1','Current123!','NewPass123!','Different123!')).rejects.toThrow(/không khớp/);
    await expect(service.changePassword('1','Current123!','        ','        ')).rejects.toThrow(/8 đến 128/);
    await expect(service.changePassword('1','Current123!','Current123!','Current123!')).rejects.toThrow(/phải khác/);
    expect(db.query).not.toHaveBeenCalled();
  });
  it('never writes when the current password is wrong',async()=>{
    const db={query:vi.fn().mockResolvedValue({recordset:[{MaTaiKhoan:1,MaNguoi:1,MatKhauBam:await hashPassword('Correct123!'),PhienBanMatKhau:1}]})};
    const service=new LocalAccountService(new ConfigService(),db as any);
    await expect(service.changePassword('1','Wrong123!','NewPass123!','NewPass123!')).rejects.toThrow(/hiện tại không đúng/);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
