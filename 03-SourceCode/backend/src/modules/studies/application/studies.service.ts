import { Inject, Injectable } from '@nestjs/common';

export const STUDIES_REPOSITORY=Symbol('STUDIES_REPOSITORY');
export interface StudiesRepository {
  list(actor:string):Promise<unknown>;
  detail(id:number,actor:string):Promise<unknown>;
  register(id:number,classId:number,actor:string):Promise<unknown>;
}
@Injectable()
export class StudiesService {
  constructor(@Inject(STUDIES_REPOSITORY) private readonly repository:StudiesRepository) {}
  list(actor:string){return this.repository.list(actor);}
  detail(id:number,actor:string){return this.repository.detail(id,actor);}
  register(id:number,classId:number,actor:string){return this.repository.register(id,classId,actor);}
}
