import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const response =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Erro interno do servidor.' };
    const details =
      typeof response === 'string' ? { message: response } : response;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      request.log.error(
        { err: exception, requestId: request.id },
        'Unhandled request error',
      );
    }

    void reply.status(status).send({
      ...details,
      path: request.url,
      requestId: String(request.id),
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
