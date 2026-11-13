import {TransferController} from './presentation/transfer.controller';
import {XlsxWriterModule} from '../../shared/infrastructure/xlsx-writer.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessGuard } from '../../shared/security/access.guard';
import { ManagementService, MANAGEMENT_REPOSITORY } from './application/management.service';
import { SqlManagementRepository } from './infrastructure/sql-management.repository';
import { ManagementController } from './presentation/management.controller';
@Module({imports:[JwtModule.register({}),XlsxWriterModule],providers:[AccessGuard,ManagementService,SqlManagementRepository,{provide:MANAGEMENT_REPOSITORY,useExisting:SqlManagementRepository}],controllers:[TransferController,ManagementController],exports:[SqlManagementRepository]})
export class ManagementModule {}
