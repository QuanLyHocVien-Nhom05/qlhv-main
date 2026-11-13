import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards,ForbiddenException } from '@nestjs/common';
import {canReadResource,canWriteResource,staffRoles} from '../../../shared/security/roles';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsString, IsOptional,IsIn,Max, MaxLength, Min } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, Roles, type ActorRequest } from '../../../shared/security/access.guard';
import { ManagementService } from '../application/management.service';
export class PageDto {
  @Type(()=>Number) @IsInt() @Min(1) @Max(100000) page=1;
  @Type(()=>Number) @IsInt() @Min(1) @Max(100) limit=20;
  @IsString() @MaxLength(100) search='';
  @IsOptional() @IsString() @MaxLength(30) status?:string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) unit?:number;
}
export class ValuesDto {@IsObject() values!: Record<string,unknown>;}
@ApiTags('management') @ApiBearerAuth() @UseGuards(AccessGuard) @Roles(...staffRoles) @Controller('management')
export class ManagementController {
  constructor(private readonly service: ManagementService) {}
  @Get('metadata') metadata(@Req() req:ActorRequest) {return this.service.metadata().filter(r=>canReadResource(req.actor.roles,r.key)).map(r=>({...r,canCreate:r.canCreate&&canWriteResource(req.actor.roles,r.key,null),actions:r.actions.filter(a=>canWriteResource(req.actor.roles,r.key,a.key))}));}
  @Get('overview') overview(@Req() req:ActorRequest) {if(req.actor.roles.includes('LECTURER'))throw new ForbiddenException();return this.service.overview();}
  @Get('options/:key') options(@Param('key') key: string,@Req() req:ActorRequest) {if(req.actor.roles.includes('LECTURER')&&key!=='courses')throw new ForbiddenException();return this.service.options(key);}
  @Get(':resource') list(@Param('resource') key: string,@Query() query: PageDto,@Req() req:ActorRequest) {if(!canReadResource(req.actor.roles,key))throw new ForbiddenException();return this.service.list(key,query.page,query.limit,query.search,query.status,req.actor,query.unit);}
  @Post(':resource') create(@Param('resource') key: string,@Body() body: ValuesDto,@Req() req: ActorRequest) {if(!canWriteResource(req.actor.roles,key,null))throw new ForbiddenException();return this.service.write(key,null,null,body.values,req.actor.sub);}
  @Post(':resource/:id/actions/:action') action(@Param('resource') key: string,@Param('id',ParseIntPipe) id: number,@Param('action') action: string,@Body() body: ValuesDto,@Req() req: ActorRequest) {if(!canWriteResource(req.actor.roles,key,action))throw new ForbiddenException();return this.service.write(key,action,id,body.values,req.actor.sub);}
}
