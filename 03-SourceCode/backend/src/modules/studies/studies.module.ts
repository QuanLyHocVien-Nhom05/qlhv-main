import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessGuard } from '../../shared/security/access.guard';
import { STUDIES_REPOSITORY, StudiesService } from './application/studies.service';
import { SqlStudiesRepository } from './infrastructure/sql-studies.repository';
import { StudiesController } from './presentation/studies.controller';
@Module({imports:[JwtModule.register({})],controllers:[StudiesController],providers:[AccessGuard,StudiesService,{provide:STUDIES_REPOSITORY,useClass:SqlStudiesRepository}]})
export class StudiesModule {}
