import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AccessGuard, Roles, type ActorRequest } from '../../../shared/security/access.guard';
import { StudiesService } from '../application/studies.service';
class RegisterStudyClassDto {
  @ApiProperty({minimum:1}) @IsInt() @Min(1) MaLopHocPhan!:number;
}
@ApiTags('my-studies') @ApiBearerAuth() @Controller('my/studies')
@UseGuards(AccessGuard) @Roles('STUDENT')
export class StudiesController {
  constructor(private readonly studies:StudiesService) {}
  @Get() list(@Req() req:ActorRequest){return this.studies.list(req.actor.sub);}
  @Get(':id') detail(@Param('id',ParseIntPipe) id:number,@Req() req:ActorRequest){return this.studies.detail(id,req.actor.sub);}
  @Post(':id/registrations') register(@Param('id',ParseIntPipe) id:number,@Body() body:RegisterStudyClassDto,@Req() req:ActorRequest){return this.studies.register(id,body.MaLopHocPhan,req.actor.sub);}
}
