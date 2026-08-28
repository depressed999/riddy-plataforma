import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { HealthService } from './health.service';
import type { HealthStatus, LivenessStatus } from './health.types';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verifica a disponibilidade da API' })
  @ApiOkResponse({
    schema: {
      example: {
        dependencies: {
          postgres: { latencyMs: 2, status: 'ok' },
          redis: { latencyMs: 1, status: 'ok' },
        },
        service: 'riddy-api',
        status: 'ok',
        timestamp: '2026-08-24T12:00:00.000Z',
        uptimeSeconds: 120,
        version: '1.0.0',
      },
    },
  })
  getHealth(): Promise<HealthStatus> {
    return this.healthService.getStatus();
  }

  @Get('live')
  @ApiOperation({ summary: 'Verifica se o processo da API está vivo' })
  @ApiOkResponse({ description: 'Processo ativo.' })
  getLiveness(): LivenessStatus {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verifica PostgreSQL e Redis' })
  @ApiOkResponse({ description: 'API pronta para receber tráfego.' })
  getReadiness(): Promise<HealthStatus> {
    return this.healthService.getStatus();
  }
}
