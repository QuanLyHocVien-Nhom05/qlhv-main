import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, Roles, type ActorRequest } from '../../../shared/security/access.guard';
import { SqlProgramService } from '../application/sql-program.service';
import { CloneSqlVersionDto, CreateSqlProgramDto, RevisionSqlDto, UpdateSqlProgramDto,SqlVersionDto } from './sql-program.dto';
import { PageDto } from '../../management/presentation/management.controller';
@ApiTags('programs') @ApiBearerAuth() @UseGuards(AccessGuard) @Roles('ACADEMIC_ADMIN','LEADER','OFFICER','LECTURER') @Controller('programs')
export class SqlProgramController {
  constructor(private readonly service: SqlProgramService) {}
  @Get() list(@Query() query:PageDto) {return this.service.list(query.search);}
  @Get(':id') get(@Param('id',ParseIntPipe) id:number) {return this.service.get(id);}
  @Post() @Roles('ACADEMIC_ADMIN','OFFICER') create(@Body() input:CreateSqlProgramDto,@Req() req:ActorRequest) {return this.service.create(input,req.actor.sub);}
  @Put(':id') @Roles('ACADEMIC_ADMIN','OFFICER') update(@Param('id',ParseIntPipe) id:number,@Body() input:UpdateSqlProgramDto,@Req() req:ActorRequest) {return this.service.update(id,input,req.actor.sub);}
  @Post(':id/initial-version') @Roles('ACADEMIC_ADMIN','OFFICER') initialize(@Param('id',ParseIntPipe) id:number,@Body() input:SqlVersionDto,@Req() req:ActorRequest){return this.service.initialize(id,input,req.actor.sub);}
  @Post(':id/versions') @Roles('ACADEMIC_ADMIN','OFFICER') clone(@Param('id',ParseIntPipe) id:number,@Body() input:CloneSqlVersionDto,@Req() req:ActorRequest) {return this.service.clone(id,input.MaPhienBanGoc,input.KhoaTuyenSinh,req.actor.sub);}
  @Post(':id/versions/:version/approve') @Roles('ACADEMIC_ADMIN','LEADER') approve(@Param('id',ParseIntPipe) id:number,@Param('version',ParseIntPipe) version:number,@Body() input:RevisionSqlDto,@Req() req:ActorRequest) {return this.service.approve(id,version,input.Revision,req.actor.sub);}
}
