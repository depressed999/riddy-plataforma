import {
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const origin = request.headers.origin;

    if (!origin) {
      return true;
    }

    const allowedOrigins = this.configService
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(',')
      .map((value) => value.trim().replace(/\/$/, ''));

    if (!allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      throw new ForbiddenException('Origem não autorizada.');
    }

    return true;
  }
}
