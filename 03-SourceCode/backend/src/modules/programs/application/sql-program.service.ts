import { Inject, Injectable } from '@nestjs/common';
import { validateCurriculum } from '../domain/program';
import type { TrainingProgramInput as CreateSqlProgramDto, CurriculumInput as SqlVersionDto, TrainingProgramUpdate as UpdateSqlProgramDto } from '../domain/training-program';
export const SQL_PROGRAM_REPOSITORY=Symbol('SQL_PROGRAM_REPOSITORY');
export interface SqlProgramRepository {
  list(search: string): Promise<unknown>;
  get(id: number): Promise<unknown>;
  initialize(id:number,input:SqlVersionDto,actor:string):Promise<unknown>;
  create(input: CreateSqlProgramDto,actor: string): Promise<unknown>;
  update(id: number,input: UpdateSqlProgramDto,actor: string): Promise<unknown>;
  clone(id: number,source: number,cohort: string,actor: string): Promise<unknown>;
  approve(id: number,version: number,revision: string,actor: string): Promise<unknown>;
}
function validate(version: SqlVersionDto) {
  validateCurriculum({cohort:version.KhoaTuyenSinh,requiredCredits:version.TinChiToiThieu,courses:version.HocPhan.map(c=>({code:String(c.MaHocPhan),name:String(c.MaHocPhan),credits:c.SoTinChi,semester:c.HocKyDuKien,required:c.BatBuoc,prerequisites:c.TienQuyet.map(String)}))});
}
@Injectable()
export class SqlProgramService {
  constructor(@Inject(SQL_PROGRAM_REPOSITORY) private readonly repository: SqlProgramRepository) {}
  list(search: string) {return this.repository.list(search);}
  get(id: number) {return this.repository.get(id);}
  initialize(id:number,input:SqlVersionDto,actor:string){validate(input);return this.repository.initialize(id,input,actor);}
  create(input: CreateSqlProgramDto,actor: string) {validate(input.PhienBan);return this.repository.create(input,actor);}
  update(id: number,input: UpdateSqlProgramDto,actor: string) {validate(input.PhienBan);return this.repository.update(id,input,actor);}
  clone(id: number,source: number,cohort: string,actor: string) {return this.repository.clone(id,source,cohort,actor);}
  approve(id: number,version: number,revision: string,actor: string) {return this.repository.approve(id,version,revision,actor);}
}
