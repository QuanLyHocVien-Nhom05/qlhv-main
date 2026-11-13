import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { BusinessError } from '../../modules/programs/domain/program';
import { FieldValidationError } from '../../modules/management/domain/resource';
@Catch(BusinessError,FieldValidationError)
export class BusinessErrorFilter implements ExceptionFilter {
  catch(error: BusinessError|FieldValidationError, host: ArgumentsHost) {
    const kind=error instanceof BusinessError?error.kind:'invalid';
    const statusCode = kind === 'missing' ? 404 : kind === 'conflict' ? 409 : 400;
    host.switchToHttp().getResponse<Response>().status(statusCode).json({statusCode, message: error.message});
  }
}
