import { BadRequestException,Inject,Injectable } from '@nestjs/common';
import { hashPassword } from '../../auth/password';
import { passwordProblem,type AccountUpdate,type CreateAccountInput } from '../domain/account';
export const ACCOUNTS_REPOSITORY=Symbol('ACCOUNTS_REPOSITORY');
export interface AccountsRepository{
  list(actor:string,page:number,limit:number,search:string,state:string):Promise<unknown>;
  options(actor:string):Promise<unknown>;
  create(actor:string,input:Omit<CreateAccountInput,'MatKhau'|'XacNhanMatKhau'>,hash:string):Promise<unknown>;
  update(actor:string,id:number,input:AccountUpdate):Promise<unknown>;
  remove(actor:string,id:number,revision:string):Promise<unknown>;
}
@Injectable()
export class AccountsService{
  constructor(@Inject(ACCOUNTS_REPOSITORY) private readonly repository:AccountsRepository){}
  list(actor:string,page:number,limit:number,search:string,state:string){return this.repository.list(actor,page,limit,search,state);}
  options(actor:string){return this.repository.options(actor);}
  async create(actor:string,input:CreateAccountInput){
    const problem=passwordProblem(input.MatKhau,input.XacNhanMatKhau);if(problem)throw new BadRequestException(problem);
    if(input.MaNguoi&&[input.HoTen,input.ThuDienTu,input.SoDienThoai].some(value=>value!==undefined))throw new BadRequestException('Chọn hồ sơ hiện có hoặc nhập thông tin người mới, không dùng đồng thời.');
    const {MatKhau,XacNhanMatKhau,...profile}=input;
    return this.repository.create(actor,profile,await hashPassword(MatKhau));
  }
  private validateId(id:number){if(!Number.isSafeInteger(id)||id<1||id>999999999999)throw new BadRequestException('Mã tài khoản không hợp lệ.');}
  update(actor:string,id:number,input:AccountUpdate){this.validateId(id);return this.repository.update(actor,id,input);}
  remove(actor:string,id:number,revision:string){this.validateId(id);return this.repository.remove(actor,id,revision);}
}
