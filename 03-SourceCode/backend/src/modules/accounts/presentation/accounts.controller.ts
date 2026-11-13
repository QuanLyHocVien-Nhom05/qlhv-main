import { Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Query,Req,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { AccessGuard,Roles,type ActorRequest } from '../../../shared/security/access.guard';
import { AccountsService } from '../application/accounts.service';
import { AccountsPageDto,CreateAccountDto,DeleteAccountDto,UpdateAccountDto } from './accounts.dto';
@ApiTags('admin-accounts') @ApiBearerAuth() @Controller('admin/accounts') @UseGuards(AccessGuard) @Roles('ACADEMIC_ADMIN')
export class AccountsController{
  constructor(private readonly service:AccountsService){}
  @Get() list(@Query() query:AccountsPageDto,@Req() req:ActorRequest){return this.service.list(req.actor.sub,query.page,query.limit,query.search,query.state);}
  @Get('options') options(@Req() req:ActorRequest){return this.service.options(req.actor.sub);}
  @Post() create(@Body() body:CreateAccountDto,@Req() req:ActorRequest){return this.service.create(req.actor.sub,body);}
  @Patch(':id') update(@Param('id',ParseIntPipe) id:number,@Body() body:UpdateAccountDto,@Req() req:ActorRequest){return this.service.update(req.actor.sub,id,body);}
  @Delete(':id') remove(@Param('id',ParseIntPipe) id:number,@Body() body:DeleteAccountDto,@Req() req:ActorRequest){return this.service.remove(req.actor.sub,id,body.Revision);}
}
