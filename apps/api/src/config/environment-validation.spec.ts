import {
  validateEnvironment,
  validateWorkerEnvironment,
} from './environment-validation';

describe('validateEnvironment', () => {
  it('accepts the local development environment', () => {
    expect(
      validateEnvironment({
        CORS_ORIGIN: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://riddy:change-me@localhost:5433/riddy',
        NODE_ENV: 'development',
        REDIS_URL: 'redis://:riddy-development-redis-secret@localhost:6379/0',
      }),
    ).toBeDefined();
  });

  it('rejects partial provider credentials', () => {
    expect(() =>
      validateEnvironment({
        GOOGLE_CLIENT_ID: 'client',
        NODE_ENV: 'development',
      }),
    ).toThrow('Configure em conjunto');
  });

  it('rejects insecure production defaults', () => {
    expect(() =>
      validateEnvironment({
        AUTH_EXPOSE_RESET_TOKEN: 'true',
        AUTH_RESET_WEBHOOK_URL: 'http://localhost/reset',
        CORS_ORIGIN: 'http://localhost:3000',
        DATABASE_URL: 'postgresql://riddy:change-me@localhost:5433/riddy',
        NODE_ENV: 'production',
        REDIS_URL: 'redis://:riddy-development-redis-secret@localhost:6379/0',
        S3_ACCESS_KEY: 'riddy-development',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_KYC_BUCKET: 'riddy-kyc',
        S3_SECRET_KEY: 'riddy-development-secret',
        TRUST_PROXY: 'false',
        WEB_URL: 'http://localhost:3000',
      }),
    ).toThrow();
  });

  it('accepts an explicit production environment', () => {
    expect(() =>
      validateEnvironment({
        AUTH_EXPOSE_RESET_TOKEN: 'false',
        AUTH_RESET_WEBHOOK_URL: 'https://mailer.example.com/reset',
        CORS_ORIGIN: 'https://riddy.example.com',
        DATABASE_URL: 'postgresql://riddy:strong-password@db.internal/riddy',
        NODE_ENV: 'production',
        REDIS_URL: 'rediss://:strong-redis-password@redis.internal:6379/0',
        S3_ACCESS_KEY: 'production-access-key',
        S3_ENDPOINT: 'https://s3.example.com',
        S3_KYC_BUCKET: 'riddy-production-kyc',
        S3_SECRET_KEY: 'production-secret-key',
        TRUST_PROXY: 'true',
        WEB_URL: 'https://riddy.example.com',
      }),
    ).not.toThrow();
  });

  it('keeps the production worker configuration limited to its dependencies', () => {
    expect(() =>
      validateWorkerEnvironment({
        AUTH_RESET_WEBHOOK_URL: 'https://mailer.example.com/reset',
        DATABASE_URL: 'postgresql://riddy:strong-password@db.internal/riddy',
        NODE_ENV: 'production',
        REDIS_URL: 'rediss://:strong-redis-password@redis.internal:6379/0',
      }),
    ).not.toThrow();
  });
});
