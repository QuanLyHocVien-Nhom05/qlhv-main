import {BadRequestException,Injectable,NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,unlink,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {AdmissionsService,AdmissionActor} from '../application/admissions.service';
import {documentTypes} from '../domain/admission';
@Injectable()
export class AdmissionFiles{
 private readonly folder:string;
 constructor(private readonly service:AdmissionsService,config:ConfigService){this.folder=resolve(config.get<string>('ADMISSION_UPLOAD_DIRECTORY')||join(process.cwd(),'storage','admissions'));}
 async upload(file:{buffer:Buffer;originalname:string}|undefined,type:string,actor:AdmissionActor){
  if(!file?.buffer.length||file.buffer.length>10*1024*1024||!(documentTypes as readonly string[]).includes(type))throw new BadRequestException('Chọn tài liệu đúng loại, tối đa 10 MB.');
  const b=file.buffer,mime=b.subarray(0,5).toString()==='%PDF-'?'application/pdf':b.subarray(0,3).equals(Buffer.from([255,216,255]))?'image/jpeg':b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':null;if(!mime)throw new BadRequestException('Chỉ nhận nội dung PDF, JPG hoặc PNG.');
  const key=randomUUID()+'.enc',name=Buffer.from(file.originalname,'latin1').toString('utf8').replace(/[\x00-\x1f\\/]/g,'').slice(0,255)||'tai-lieu';
  await mkdir(this.folder,{recursive:true});await writeFile(join(this.folder,key),this.service.crypto.seal(b,'admission-file:'+key),{flag:'wx'});
  try{const result=await this.service.db.query(`INSERT tuyen_sinh.TaiLieu(MaNguoi,LoaiTaiLieu,TenTep,KhoaLuuTru,LoaiNoiDung,DungLuong,BamSha256) OUTPUT inserted.MaTaiLieu VALUES(@Nguoi,@Type,@Name,@Key,@Mime,@Size,@Hash)`,{Nguoi:actor.sub,Type:type,Name:name,Key:key,Mime:mime,Size:b.length,Hash:createHash('sha256').update(b).digest('hex')});return {MaTaiLieu:result.recordset[0].MaTaiLieu,TenTep:name};}catch(error){await unlink(join(this.folder,key));throw error;}
 }
 async content(id:number,actor:AdmissionActor){const row=(await this.service.db.query<any>('SELECT * FROM tuyen_sinh.TaiLieu WHERE MaTaiLieu=@Id',{Id:id})).recordset[0];if(!row)throw new NotFoundException();if(String(row.MaNguoi)!==actor.sub){if(!row.MaHoSo)throw new NotFoundException();await this.service.get(Number(row.MaHoSo),actor);}return {...row,buffer:await this.read(row.KhoaLuuTru)};}
 async read(key:string){if(!/^[a-f0-9-]{36}\.enc$/.test(key))throw new NotFoundException();try{return this.service.crypto.open(await readFile(join(this.folder,key)),'admission-file:'+key);}catch{throw new NotFoundException('Không đọc được tài liệu đã bảo vệ.');}}
}
