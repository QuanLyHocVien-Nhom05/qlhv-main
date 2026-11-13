import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessGuard } from '../../shared/security/access.guard';
import { SQL_PROGRAM_REPOSITORY,SqlProgramService } from './application/sql-program.service';
import { SqlProgramsRepository } from './infrastructure/sql-program.repository';
import { SqlProgramController } from './presentation/sql-program.controller';
@Module({
  imports: [JwtModule.register({})], controllers: [SqlProgramController],
  providers: [AccessGuard, SqlProgramService, {provide: SQL_PROGRAM_REPOSITORY, useClass: SqlProgramsRepository}],
  exports: [SqlProgramService],
})
export class ProgramsModule {}
