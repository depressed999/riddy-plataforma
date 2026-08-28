# Jobs e Redis

A Etapa 17 introduz Redis e BullMQ somente nos pontos em que já havia necessidade concreta: cache compartilhado do catálogo, limitação global distribuída, entrega assíncrona de recuperação de senha e manutenção periódica dos dados de autenticação.

## Redis local

O serviço `redis` do Docker Compose usa persistência AOF, senha e a política `noeviction`, necessária para evitar remoção silenciosa de chaves de filas. Ele é iniciado junto da infraestrutura com:

```bash
pnpm infra:up
```

Também pode ser iniciado isoladamente com `pnpm redis:up`. A API considera Redis uma dependência obrigatória e o inclui em `GET /api/v1/health`.

As chaves recebem o prefixo configurado por `REDIS_KEY_PREFIX`. Em produção, use uma senha forte, rede privada, TLS por uma URL `rediss://`, persistência monitorada e instância dedicada ou capacidade reservada para filas.

## Cache do catálogo

As buscas públicas e os detalhes de veículos ativos são armazenados em JSON por 30 segundos, configuráveis por `CACHE_VEHICLES_TTL_SECONDS`. O cache usa um lock curto para reduzir estouros de consultas simultâneas e uma tag de namespace para invalidação.

Criação, edição ou alteração de status feita pelo anfitrião, além da moderação administrativa de status, invalidam imediatamente todo o namespace `vehicles`. O PostgreSQL continua sendo a fonte de verdade.

## Limitação distribuída

O `ThrottlerGuard` do Nest usa um storage Redis atômico. Assim, `THROTTLE_LIMIT`, `THROTTLE_TTL_MS` e `THROTTLE_BLOCK_DURATION_MS` valem para o conjunto de instâncias da API, e não separadamente para cada processo.

## Filas e jobs

A fila `riddy-jobs` contém:

- `auth.password-recovery`: entrega o link pelo webhook configurado, com cinco tentativas e backoff exponencial;
- `maintenance.auth-cleanup`: remove sessões expiradas e tokens de redefinição expirados ou usados há mais de sete dias.

O segundo job é registrado por Job Scheduler e executado a cada hora por padrão. O intervalo é configurável por `JOBS_AUTH_CLEANUP_INTERVAL_MS`.

No desenvolvimento, `JOBS_WORKER_ENABLED=true` mantém o worker embutido na API. Para separar os processos em produção:

1. execute a API com `JOBS_WORKER_ENABLED=false`;
2. execute `pnpm start:worker` em um processo ou contêiner próprio;
3. mantenha o mesmo `REDIS_URL`, `REDIS_KEY_PREFIX` e acesso ao PostgreSQL nos dois processos.

O entrypoint dedicado força a habilitação do consumidor, portanto a configuração que desliga o worker embutido não impede o processo separado de trabalhar. Escale workers independentemente da API e monitore jobs falhos, latência, conexões, memória e persistência do Redis.

## Variáveis

- `REDIS_URL` e `REDIS_KEY_PREFIX`;
- `CACHE_VEHICLES_TTL_SECONDS`;
- `THROTTLE_LIMIT`, `THROTTLE_TTL_MS` e `THROTTLE_BLOCK_DURATION_MS`;
- `JOBS_WORKER_ENABLED` e `JOBS_SCHEDULER_ENABLED`;
- `JOBS_AUTH_CLEANUP_INTERVAL_MS`;
- `AUTH_RESET_WEBHOOK_URL` e `AUTH_RESET_WEBHOOK_SECRET`.

WebSockets não foram adicionados: o polling atual das mensagens ainda atende ao MVP. A infraestrutura Redis permite reavaliar distribuição de eventos quando presença, digitação ou atualização instantânea em escala se tornarem requisitos reais.
