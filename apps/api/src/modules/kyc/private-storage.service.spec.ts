import { HeadBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

import { PrivateStorageService } from './private-storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const mockedGetSignedUrl = jest.mocked(getSignedUrl);

describe('PrivateStorageService', () => {
  beforeEach(() => {
    mockedGetSignedUrl.mockResolvedValue('https://storage.example/upload');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not try to configure bucket CORS on Supabase Storage', async () => {
    const { send, storage } = createStorage({
      NODE_ENV: 'production',
      S3_ACCESS_KEY: 'access-key',
      S3_ENDPOINT: 'https://project-ref.storage.supabase.co/storage/v1/s3',
      S3_SECRET_KEY: 'secret-key',
    });

    await storage.createUploadUrl('kyc/user/document.jpg', 'image/jpeg');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls.flat()).not.toEqual(
      expect.arrayContaining([expect.any(PutBucketCorsCommand)]),
    );
  });

  it('keeps automatic CORS configuration enabled for local MinIO', async () => {
    const { send, storage } = createStorage({
      CORS_ORIGIN: 'http://localhost:3000',
      NODE_ENV: 'development',
      S3_ENDPOINT: 'http://localhost:9000',
    });

    await storage.createUploadUrl('kyc/user/document.jpg', 'image/jpeg');

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(PutBucketCorsCommand);
  });

  it('allows bucket CORS management to be disabled explicitly', async () => {
    const { send, storage } = createStorage({
      NODE_ENV: 'production',
      S3_ACCESS_KEY: 'access-key',
      S3_ENDPOINT: 'https://s3.example.com',
      S3_MANAGE_BUCKET_CORS: 'false',
      S3_SECRET_KEY: 'secret-key',
    });

    await storage.createUploadUrl('kyc/user/document.jpg', 'image/jpeg');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
  });
});

function createStorage(environment: Record<string, string>): {
  send: jest.Mock;
  storage: PrivateStorageService;
} {
  const storage = new PrivateStorageService(new ConfigService(environment));
  const send = jest.fn().mockResolvedValue({});
  Object.assign(storage, { client: { send } });
  return { send, storage };
}
