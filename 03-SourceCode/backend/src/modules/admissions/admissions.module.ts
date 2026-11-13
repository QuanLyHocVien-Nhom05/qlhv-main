import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {AccessGuard} from '../../shared/security/access.guard';
import {XlsxWriterModule} from '../../shared/infrastructure/xlsx-writer.module';
import {AdmissionsService} from './application/admissions.service';
import {ExamService} from './application/exam.service';
import {AdmissionFiles} from './infrastructure/admission-files.service';
import {PaymentGateway} from './infrastructure/payment.gateway';
import {AdmissionDocuments} from './infrastructure/admission-documents.service';
import {AdmissionJobs} from './infrastructure/admission-jobs.service';
import {ExternalAdapters} from './infrastructure/external.adapters';
import {RecoveryMailer} from '../password-recovery/infrastructure/recovery-mailer';
import {AdmissionsAdminController,AdmissionsOwnerController,AdmissionsPublicController,AdmissionFileController} from './presentation/admissions.controller';
@Module({imports:[JwtModule.register({}),XlsxWriterModule],controllers:[AdmissionsPublicController,AdmissionsOwnerController,AdmissionFileController,AdmissionsAdminController],providers:[AccessGuard,AdmissionsService,ExamService,AdmissionFiles,PaymentGateway,AdmissionDocuments,AdmissionJobs,ExternalAdapters,RecoveryMailer]})
export class AdmissionsModule{}
