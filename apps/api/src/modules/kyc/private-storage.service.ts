import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import type { VerifiedStoredObject } from './kyc.types';

@Injectable()
export class PrivateStorageService {
  private readonly logger = new Logger(PrivateStorageService.name);
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly isProduction: boolean;
  private readonly manageBucketCors: boolean;
  private readonly signedUrlTtlSeconds: number;
  private bucketReady?: Promise<void>;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    const accessKeyId = this.getCredential(
      'S3_ACCESS_KEY',
      'riddy-development',
    );
    const secretAccessKey = this.getCredential(
      'S3_SECRET_KEY',
      'riddy-development-secret',
    );
    this.bucket = configService.get<string>('S3_KYC_BUCKET', 'riddy-kyc');
    const endpoint = configService.get<string>(
      'S3_ENDPOINT',
      'http://localhost:9000',
    );
    const manageBucketCors = configService.get<string>('S3_MANAGE_BUCKET_CORS');
    // Supabase aplica CORS na borda e não implementa a operação S3
    // PutBucketCors. Outros provedores, incluindo o MinIO local, mantêm o
    // comportamento anterior, com possibilidade de override pela variável.
    this.manageBucketCors =
      manageBucketCors === undefined
        ? !isSupabaseStorageEndpoint(endpoint)
        : manageBucketCors === 'true';
    this.signedUrlTtlSeconds = boundedNumber(
      configService.get<string>('S3_SIGNED_URL_TTL_SECONDS'),
      300,
      60,
      900,
    );
    this.client = new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      endpoint,
      forcePathStyle:
        configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true',
      region: configService.get<string>('S3_REGION', 'us-east-1'),
    });
  }

  async createUploadUrl(
    storageKey: string,
    mimeType: string,
  ): Promise<{
    expiresAt: Date;
    headers: Record<string, string>;
    url: string;
  }> {
    await this.ensureBucket();
    const expiresAt = new Date(Date.now() + this.signedUrlTtlSeconds * 1000);
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        ContentType: mimeType,
        Key: storageKey,
      }),
      { expiresIn: this.signedUrlTtlSeconds },
    );

    return {
      expiresAt,
      headers: { 'content-type': mimeType },
      url,
    };
  }

  async createViewUrl(storageKey: string): Promise<string> {
    await this.ensureBucket();
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn: Math.min(this.signedUrlTtlSeconds, 300) },
    );
  }

  async verifyObject(
    storageKey: string,
    expectedMimeType: string,
    expectedSizeBytes: number,
  ): Promise<VerifiedStoredObject> {
    await this.ensureBucket();

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      if (!response.Body) {
        throw new Error('Object body is missing.');
      }

      const bytes = await response.Body.transformToByteArray();
      if (bytes.byteLength !== expectedSizeBytes) {
        throw new BadRequestException(
          'O tamanho do arquivo recebido não corresponde ao upload autorizado.',
        );
      }

      const detectedMimeType = detectMimeType(bytes);
      if (detectedMimeType !== expectedMimeType) {
        throw new BadRequestException(
          'O conteúdo do arquivo não corresponde ao formato informado.',
        );
      }

      return {
        checksumSha256: createHash('sha256').update(bytes).digest('hex'),
        mimeType: detectedMimeType,
        sizeBytes: bytes.byteLength,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Não foi possível validar o documento no storage privado.',
      );
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }

  private ensureBucket(): Promise<void> {
    this.bucketReady ??= this.prepareBucket();
    return this.bucketReady;
  }

  private async prepareBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'O storage privado não está disponível.',
        );
      }

      try {
        await this.client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
      } catch {
        this.bucketReady = undefined;
        throw new ServiceUnavailableException(
          'Não foi possível preparar o storage privado local.',
        );
      }
    }

    if (!this.manageBucketCors) {
      return;
    }

    try {
      const allowedOrigins = this.configService
        .get<string>('CORS_ORIGIN', 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD', 'PUT'],
                AllowedOrigins: allowedOrigins,
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'O storage privado não permite configurar CORS.',
        );
      }
      this.logger.warn('Private storage CORS could not be refreshed.');
    }
  }

  private getCredential(key: string, developmentFallback: string): string {
    const value = this.configService.get<string>(key);
    if (value) {
      return value;
    }
    if (this.isProduction) {
      throw new Error(`${key} is required in production.`);
    }
    return developmentFallback;
  }
}

function isSupabaseStorageEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname.endsWith('.storage.supabase.co') ||
      (hostname.endsWith('.supabase.co') &&
        url.pathname.startsWith('/storage/v1/s3'))
    );
  } catch {
    return false;
  }
}

function detectMimeType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-'
  ) {
    return 'application/pdf';
  }
  return null;
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, minimum), maximum)
    : fallback;
}
