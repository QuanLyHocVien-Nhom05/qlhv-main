import {AdmissionsModule} from './modules/admissions/admissions.module';
import {DataProtectionModule} from './shared/security/data-protection';
import {TrainingPortalModule} from './modules/training-portal/training-portal.module';
import { RecoveryModule } from './modules/password-recovery/recovery.module';
import { ReportsModule } from './modules/reports/reports.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProgramsModule } from './modules/programs/programs.module';
import { SqlServerModule } from './shared/infrastructure/sql-server.service';
import { ManagementModule } from './modules/management/management.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicModule } from './modules/public/public.module';
import { StudiesModule } from './modules/studies/studies.module';
import { AccountsModule } from './modules/accounts/accounts.module';
@Module({imports: [AdmissionsModule,DataProtectionModule,TrainingPortalModule,ConfigModule.forRoot({isGlobal: true, validate: env => {
  if (typeof env.JWT_SECRET !== 'string' || env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must have at least 32 characters');
  for (const key of ['SQLSERVER_CONNECTION_STRING', 'JWT_ISSUER', 'JWT_AUDIENCE']) if (!env[key]) throw new Error(`${key} is required`);
  if (env.NODE_ENV==='production'&&env.DEV_LOGIN_ENABLED==='true') throw new Error('DEV_LOGIN_ENABLED must be false in production');
  return env;
}}), SqlServerModule,ManagementModule,ProgramsModule,AuthModule,PublicModule,StudiesModule,AccountsModule,ReportsModule,RecoveryModule]})
export class AppModule {}
