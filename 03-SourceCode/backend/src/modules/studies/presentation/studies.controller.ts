import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, Roles, type ActorRequest } from '../../../shared/security/access.guard';
import { StudiesService } from '../application/studies.service';
@ApiTags('my-studies') @ApiBearerAuth() @Controller('my/studies')
@UseGuards(AccessGuard) @Roles('STUDENT')
export class StudiesController {
  constructor(private readonly studies:StudiesService) {}
  @Get() list(@Req() req:ActorRequest){return this.studies.list(req.actor.sub);}
  @Get(':id') detail(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.studies.detail(id,req.actor.sub);}
}
