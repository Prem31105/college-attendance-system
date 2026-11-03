import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'An internal server error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        error = (res as any).error || exception.name;
      } else {
        message = res;
        error = exception.name;
      }
    } else {
      // Unhandled / Internal / Database Exception - mask sensitive internals
      const err = exception as any;
      this.logger.error(
        `Unhandled exception on ${request?.method} ${request?.url}: ${err?.message || err}`,
        err?.stack,
      );

      // Mask raw database errors, syntax errors, and internal stack traces
      message = 'An unexpected internal error occurred. Please contact system administrator.';
      error = 'Internal Server Error';
    }

    const errorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url || '',
      error,
      message,
    };

    response.status(status).json(errorPayload);
  }
}
