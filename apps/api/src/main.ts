import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import fastifyCookie from '@fastify/cookie';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    bodyLimit: positiveInteger(process.env.API_BODY_LIMIT_BYTES, 1_048_576),
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: {
        censor: '[REDACTED]',
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers.set-cookie',
        ],
      },
    },
    requestIdHeader: 'x-request-id',
    trustProxy: trustProxySetting(process.env.TRUST_PROXY),
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );
  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 4000);
  const isProduction =
    configService.get<string>('NODE_ENV', 'development') === 'production';
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  await app.register(fastifyCookie as never);
  await app.register(fastifyHelmet as never, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProduction
      ? { includeSubDomains: true, maxAge: 31_536_000, preload: true }
      : false,
  });
  adapter.getInstance().addHook('onRequest', (request, reply, done) => {
    void reply.header('x-request-id', request.id);
    const path = request.url.split('?', 1)[0] ?? request.url;
    const isPublicCatalog =
      request.method === 'GET' &&
      (path === '/api/v1/vehicles' || path.startsWith('/api/v1/vehicles/'));
    void reply.header(
      'cache-control',
      isPublicCatalog
        ? 'public, max-age=30, stale-while-revalidate=30'
        : 'no-store',
    );
    done();
  });
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    credentials: true,
    exposedHeaders: ['x-request-id'],
    maxAge: 86_400,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    origin: corsOrigins,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const swaggerEnabled =
    configService.get<string>(
      'SWAGGER_ENABLED',
      isProduction ? 'false' : 'true',
    ) === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Riddy API')
      .setDescription('API REST da plataforma Riddy')
      .setVersion(configService.get<string>('APP_VERSION', 'development'))
      .addCookieAuth('riddy_session')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
}

void bootstrap();

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function trustProxySetting(value: string | undefined): boolean | string {
  if (!value || value === 'false') return false;
  return value === 'true' ? true : value;
}
