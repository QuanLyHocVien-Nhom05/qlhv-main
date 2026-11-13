import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import * as sql from 'mssql/msnodesqlv8';
@Catch(sql.RequestError, sql.ConnectionError)
export class SqlErrorFilter implements ExceptionFilter {
  catch(error: sql.RequestError, host: ArgumentsHost) {
    const number = error.number ?? (error as any).originalError?.info?.number;
    let statusCode = 500; let message = 'Không thể xử lý dữ liệu. Vui lòng thử lại.';
    if (number >= 51000 && number < 52000) {statusCode = 400; message = error.message;}
    if (number === 51091) {statusCode = 409;message = error.message;}
    if (number === 51203) {statusCode = 403;message = error.message;}
    if (number === 51204) {statusCode = 404;message = error.message;}
    if ([2601, 2627].includes(number)) {statusCode = 409; message = 'Mã hoặc dữ liệu này đã tồn tại.';}
    if (number === 547) {statusCode = 400; message = 'Dữ liệu tham chiếu hoặc điều kiện ràng buộc không hợp lệ.';}
    if (number === 1205) {statusCode = 409; message = 'Dữ liệu đang được cập nhật đồng thời. Vui lòng thử lại.';}
    if (statusCode === 500) Logger.error(error.message, undefined, 'SqlServer');
    host.switchToHttp().getResponse<Response>().status(statusCode).json({statusCode, message});
  }
}
