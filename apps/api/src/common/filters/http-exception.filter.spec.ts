import { BadRequestException, type ArgumentsHost } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const buildContext = () => {
    const error = jest.fn();
    const request = {
      id: 'request-123',
      log: { error },
      url: '/api/v1/profile',
    } as unknown as FastifyRequest;
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const reply = { status } as unknown as FastifyReply;
    const host = {
      switchToHttp: () => ({
        getNext: jest.fn(),
        getRequest: () => request,
        getResponse: () => reply,
      }),
    } as unknown as ArgumentsHost;

    return { error, host, send, status };
  };

  it('adds trace data to expected HTTP errors', () => {
    const context = buildContext();

    new HttpExceptionFilter().catch(
      new BadRequestException('Dados inválidos.'),
      context.host,
    );

    expect(context.status).toHaveBeenCalledWith(400);
    expect(context.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Dados inválidos.',
        path: '/api/v1/profile',
        requestId: 'request-123',
        statusCode: 400,
      }),
    );
    expect(context.error).not.toHaveBeenCalled();
  });

  it('logs unexpected errors and keeps their details out of the response', () => {
    const context = buildContext();

    new HttpExceptionFilter().catch(
      new Error('database-secret-detail'),
      context.host,
    );

    expect(context.error).toHaveBeenCalled();
    expect(context.status).toHaveBeenCalledWith(500);
    expect(context.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Erro interno do servidor.',
        requestId: 'request-123',
        statusCode: 500,
      }),
    );
    expect(JSON.stringify(context.send.mock.calls)).not.toContain(
      'database-secret-detail',
    );
  });
});
