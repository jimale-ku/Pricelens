import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { pino } from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: exception instanceof Error ? exception.message : 'Internal server error',
            stack: exception instanceof Error ? exception.stack : undefined,
          };

    // Only log 5xx errors as errors, 4xx are expected client errors
    const isServerError = status >= 500;
    const isClientError = status >= 400 && status < 500;
    
    // Don't log 401 Unauthorized or 404 Not Found as errors (they're expected)
    const shouldLogAsError = isServerError || (isClientError && status !== 401 && status !== 404);
    
    const logData = {
      status,
      path: request.url,
      method: request.method,
      exception: isServerError ? exception : undefined, // Only include exception details for server errors
    };

    if (shouldLogAsError) {
      logger.error(logData, 'Unhandled exception');
    } else if (isClientError) {
      // Log 4xx errors at debug level (except 401/404 which are very common)
      if (status === 401 || status === 404) {
        logger.debug(logData, `Client error: ${status}`);
      } else {
        logger.warn(logData, `Client error: ${status}`);
      }
    }

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      error: errorResponse,
    });
  }
}







