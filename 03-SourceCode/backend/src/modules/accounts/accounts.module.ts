import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessGuard } from '../../shared/security/access.guard';
import { ACCOUNTS_REPOSITORY,AccountsService } from './application/accounts.service';
import { SqlAccountsRepository } from './infrastructure/sql-accounts.repository';
import { AccountsController } from './presentation/accounts.controller';
@Module({imports:[JwtModule.register({})],controllers:[AccountsController],providers:[AccessGuard,AccountsService,{provide:ACCOUNTS_REPOSITORY,useClass:SqlAccountsRepository}]})
export class AccountsModule{}
