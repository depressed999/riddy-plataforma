const developmentSecrets = new Set([
  'change-me',
  'riddy-development',
  'riddy-development-secret',
  'riddy-development-redis-secret',
]);

const booleanKeys = [
  'AUTH_EXPOSE_RESET_TOKEN',
  'JOBS_SCHEDULER_ENABLED',
  'JOBS_WORKER_ENABLED',
  'S3_FORCE_PATH_STYLE',
  'S3_MANAGE_BUCKET_CORS',
  'SWAGGER_ENABLED',
] as const;

const positiveIntegerKeys = [
  'API_BODY_LIMIT_BYTES',
  'API_PORT',
  'CACHE_VEHICLES_TTL_SECONDS',
  'DATABASE_POOL_SIZE',
  'JOBS_AUTH_CLEANUP_INTERVAL_MS',
  'S3_SIGNED_URL_TTL_SECONDS',
  'THROTTLE_BLOCK_DURATION_MS',
  'THROTTLE_LIMIT',
  'THROTTLE_TTL_MS',
] as const;

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnvironment = validateBaseEnvironment(environment);

  validateOptionalUrl(environment, 'WEB_URL', ['http:', 'https:']);
  validateOptionalUrl(environment, 'S3_ENDPOINT', ['http:', 'https:']);
  validateOptionalUrl(environment, 'GOOGLE_REDIRECT_URI', ['http:', 'https:']);
  validateOptionalUrl(environment, 'MERCADO_PAGO_API_URL', ['https:']);
  validateOptionalUrl(environment, 'MERCADO_PAGO_WEBHOOK_URL', [
    'http:',
    'https:',
  ]);
  validateCorsOrigins(environment);
  validateCompleteGroup(environment, [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
  ]);
  validateCompleteGroup(environment, [
    'MERCADO_PAGO_PUBLIC_KEY',
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_WEBHOOK_SECRET',
    'MERCADO_PAGO_WEBHOOK_URL',
  ]);
  validateCookieSameSite(environment, nodeEnvironment);

  if (nodeEnvironment === 'production') {
    validateProductionEnvironment(environment);
  }

  return environment;
}

export function validateWorkerEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnvironment = validateBaseEnvironment(environment);

  if (nodeEnvironment === 'production') {
    for (const key of [
      'AUTH_RESET_WEBHOOK_URL',
      'DATABASE_URL',
      'REDIS_URL',
    ] as const) {
      requireValue(environment, key);
    }
    validateProductionCredentials(environment);
    requireHttps(environment, ['AUTH_RESET_WEBHOOK_URL']);
  }

  return environment;
}

function validateBaseEnvironment(environment: Record<string, unknown>): string {
  const nodeEnvironment = stringValue(environment, 'NODE_ENV') ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnvironment)) {
    fail('NODE_ENV deve ser development, production ou test.');
  }

  for (const key of booleanKeys) {
    const value = stringValue(environment, key);
    if (value && value !== 'true' && value !== 'false') {
      fail(`${key} deve ser true ou false.`);
    }
  }

  for (const key of positiveIntegerKeys) {
    const value = stringValue(environment, key);
    if (value && (!Number.isInteger(Number(value)) || Number(value) <= 0)) {
      fail(`${key} deve ser um número inteiro positivo.`);
    }
  }

  validateOptionalUrl(environment, 'DATABASE_URL', [
    'postgres:',
    'postgresql:',
  ]);
  validateOptionalUrl(environment, 'REDIS_URL', ['redis:', 'rediss:']);
  validateOptionalUrl(environment, 'AUTH_RESET_WEBHOOK_URL', [
    'http:',
    'https:',
  ]);
  return nodeEnvironment;
}

function validateProductionEnvironment(
  environment: Record<string, unknown>,
): void {
  const required = [
    'AUTH_RESET_WEBHOOK_URL',
    'DATABASE_URL',
    'REDIS_URL',
    'S3_ACCESS_KEY',
    'S3_ENDPOINT',
    'S3_KYC_BUCKET',
    'S3_SECRET_KEY',
    'TRUST_PROXY',
    'WEB_URL',
  ] as const;
  for (const key of required) requireValue(environment, key);

  if (stringValue(environment, 'AUTH_EXPOSE_RESET_TOKEN') === 'true') {
    fail('AUTH_EXPOSE_RESET_TOKEN não pode ser true em produção.');
  }

  validateProductionCredentials(environment);
  requireHttps(environment, [
    'AUTH_RESET_WEBHOOK_URL',
    'GOOGLE_REDIRECT_URI',
    'MERCADO_PAGO_WEBHOOK_URL',
    'WEB_URL',
  ]);

  const origins = requireValue(environment, 'CORS_ORIGIN').split(',');
  if (origins.some((origin) => new URL(origin.trim()).protocol !== 'https:')) {
    fail('Todas as origens em CORS_ORIGIN devem usar HTTPS em produção.');
  }
}

function validateProductionCredentials(
  environment: Record<string, unknown>,
): void {
  for (const key of [
    'POSTGRES_PASSWORD',
    'REDIS_PASSWORD',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
  ] as const) {
    const value = stringValue(environment, key);
    if (value && developmentSecrets.has(value)) {
      fail(`${key} ainda usa uma credencial de desenvolvimento.`);
    }
  }

  const databaseUrl = new URL(requireValue(environment, 'DATABASE_URL'));
  const redisUrl = new URL(requireValue(environment, 'REDIS_URL'));
  if (
    !databaseUrl.password ||
    developmentSecrets.has(decodeURIComponent(databaseUrl.password))
  ) {
    fail('DATABASE_URL deve conter uma senha de produção.');
  }
  if (
    !redisUrl.password ||
    developmentSecrets.has(decodeURIComponent(redisUrl.password))
  ) {
    fail('REDIS_URL deve conter uma senha de produção.');
  }
}

function requireHttps(
  environment: Record<string, unknown>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    const value = stringValue(environment, key);
    if (value && new URL(value).protocol !== 'https:') {
      fail(`${key} deve usar HTTPS em produção.`);
    }
  }
}

function validateCorsOrigins(environment: Record<string, unknown>): void {
  const configured = stringValue(environment, 'CORS_ORIGIN');
  if (!configured) return;
  for (const origin of configured.split(',')) {
    const normalized = origin.trim().replace(/\/$/, '');
    let parsed: URL;
    try {
      parsed = new URL(normalized);
    } catch {
      fail(`CORS_ORIGIN contém uma origem inválida: ${origin.trim()}.`);
    }
    if (
      parsed.origin !== normalized ||
      !['http:', 'https:'].includes(parsed.protocol)
    ) {
      fail(
        `CORS_ORIGIN deve conter apenas origens HTTP(S), sem caminhos: ${origin.trim()}.`,
      );
    }
  }
}

function validateCompleteGroup(
  environment: Record<string, unknown>,
  keys: readonly string[],
): void {
  const present = keys.filter((key) => Boolean(stringValue(environment, key)));
  if (present.length > 0 && present.length !== keys.length) {
    fail(`Configure em conjunto: ${keys.join(', ')}.`);
  }
}

function validateOptionalUrl(
  environment: Record<string, unknown>,
  key: string,
  protocols: readonly string[],
): void {
  const value = stringValue(environment, key);
  if (!value) return;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${key} deve ser uma URL válida.`);
  }
  if (!protocols.includes(parsed.protocol)) {
    fail(`${key} deve usar ${protocols.join(' ou ')}.`);
  }
}

function requireValue(
  environment: Record<string, unknown>,
  key: string,
): string {
  const value = stringValue(environment, key);
  if (!value) fail(`${key} é obrigatória em produção.`);
  return value;
}

function stringValue(
  environment: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = environment[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function validateCookieSameSite(
  environment: Record<string, unknown>,
  nodeEnvironment: string,
): void {
  const value = stringValue(environment, 'COOKIE_SAME_SITE');
  if (!value) return;
  if (!['lax', 'none', 'strict'].includes(value)) {
    fail('COOKIE_SAME_SITE deve ser lax, strict ou none.');
  }
  if (value === 'none' && nodeEnvironment !== 'production') {
    fail(
      'COOKIE_SAME_SITE=none requer NODE_ENV=production (cookies SameSite=None exigem Secure).',
    );
  }
}

function fail(message: string): never {
  throw new Error(`Configuração inválida: ${message}`);
}
