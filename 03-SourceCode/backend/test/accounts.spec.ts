import 'reflect-metadata';
import { describe,expect,it,vi } from 'vitest';
import { AccountsService } from '../src/modules/accounts/application/accounts.service';
describe('Administrative account creation validation',()=>{
  it('rejects invalid or unsafe account identifiers before querying SQL',()=>{
    const service=new AccountsService({remove:vi.fn()} as any);
    for(const id of [-1,1.5,Number.MAX_SAFE_INTEGER+1])expect(()=>service.remove('1',id,'0x0000000000000001')).toThrow(/Mã tài khoản/);
  });
  const input={HoTen:'Người dùng',ThuDienTu:'user@example.invalid',TenDangNhap:'test_user',VaiTro:'USER' as const,MatKhau:'AccountPassword123!',XacNhanMatKhau:'AccountPassword123!'};
  it('rejects mismatched and blank passwords before persistence',async()=>{
    const repository={create:vi.fn()};const service=new AccountsService(repository as any);
    await expect(service.create('1',{...input,XacNhanMatKhau:'Different123!'})).rejects.toThrow(/không khớp/);
    await expect(service.create('1',{...input,MatKhau:'        ',XacNhanMatKhau:'        '})).rejects.toThrow(/8 đến 128/);
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('rejects mixed new-person and existing-profile identities',async()=>{
    const repository={create:vi.fn()};const service=new AccountsService(repository as any);
    await expect(service.create('1',{...input,MaNguoi:2})).rejects.toThrow(/không dùng đồng thời/);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
