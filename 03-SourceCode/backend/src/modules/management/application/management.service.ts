import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Field, Resource, validateFields } from '../domain/resource';
import {reportColumns} from '../../admissions/domain/report';
export type ResourceDescription=Omit<Resource,'query'|'insert'|'actions'> & {canCreate:boolean;actions:{key:string;label:string;fields:Field[]}[]};
export const MANAGEMENT_REPOSITORY = Symbol('MANAGEMENT_REPOSITORY');
export interface ManagementRepository {
  metadata(): ResourceDescription[];
  list(key: string, page: number, limit: number, search: string,status?:string,actor?:{sub:string;roles:string[]},unit?:number): Promise<any>;
  options(key: string): Promise<unknown>;
  write(key: string, action: string | null, id: number | null, values: Record<string,unknown>, actorId: string): Promise<unknown>;
  overview(): Promise<unknown>;
}
@Injectable()
export class ManagementService {
  constructor(@Inject(MANAGEMENT_REPOSITORY) private readonly repository: ManagementRepository) {}
  metadata() {return this.repository.metadata();}
  list(key: string, page: number, limit: number, search: string,status?:string,actor?:{sub:string;roles:string[]},unit?:number) {
    if (!this.metadata().some(r=>r.key===key)) throw new NotFoundException('Không tìm thấy danh mục.');
    return this.repository.list(key,page,limit,search,status,actor,unit);
  }
  options(key: string) {return this.repository.options(key);}
  write(key: string, action: string | null, id: number | null, values: Record<string,unknown>, actor: string) {
    const resource=this.metadata().find(r=>r.key===key);
    if (!resource) throw new NotFoundException('Không tìm thấy danh mục.');
    let fields: Field[];
    if (action) {const definition=resource.actions?.find(a=>a.key===action); if (!definition) throw new NotFoundException('Thao tác không tồn tại.'); fields=definition.fields;}
    else {if (!resource.canCreate) throw new BadRequestException('Danh mục này không hỗ trợ tạo trực tiếp.'); fields=resource.fields;}
    const validated=validateFields(fields,values);if(key==='admission-report-templates'&&!action)reportColumns(String(validated.CauHinhCot));
    return this.repository.write(key,action,id,validated,actor);
  }
  overview() {return this.repository.overview();}

}
