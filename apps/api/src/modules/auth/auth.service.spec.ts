import {
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { JobsQueueService } from '../../infrastructure/jobs/jobs-queue.service';
import type { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { PublicUser } from './auth.types';

const publicUser: PublicUser = {
  avatarUrl: null,
  email: 'nycolas@example.com',
  emailVerified: false,
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Nycolas Silva',
  role: 'user',
};

describe('AuthService', () => {
  let repository: jest.Mocked<AuthRepository>;
  let jobsQueue: jest.Mocked<JobsQueueService>;
  let service: AuthService;
  let environment: Record<string, string>;

  beforeEach(() => {
    repository = {
      createSession: jest.fn(),
      createUser: jest.fn(),
      deleteSession: jest.fn(),
      findOrCreateGoogleUser: jest.fn(),
      findSession: jest.fn(),
      findUserByEmail: jest.fn(),
      isUserActive: jest.fn().mockResolvedValue(true),
      replacePasswordResetToken: jest.fn(),
      resetPassword: jest.fn(),
      touchSession: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    jobsQueue = {
      enqueuePasswordRecovery: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<JobsQueueService>;
    environment = {
      AUTH_EXPOSE_RESET_TOKEN: 'true',
      AUTH_RESET_TTL_MINUTES: '30',
      AUTH_SESSION_TTL_DAYS: '30',
      NODE_ENV: 'development',
      WEB_URL: 'http://localhost:3000',
    };
    const configService = {
      get: jest.fn((key: string, fallback?: string) =>
        key in environment ? environment[key] : fallback,
      ),
    } as unknown as ConfigService;
    service = new AuthService(repository, configService, jobsQueue);
  });

  it('registers a normalized user and persists only the session token hash', async () => {
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createUser.mockResolvedValue(publicUser);

    const result = await service.register({
      email: '  NYCOLAS@example.com ',
      name: ' Nycolas Silva ',
      password: 'Riddy@2026',
    });

    expect(repository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'nycolas@example.com',
        name: 'Nycolas Silva',
      }),
    );
    expect(repository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        userId: publicUser.id,
      }),
    );
    expect(result.token).toHaveLength(43);
    expect(result.user).toEqual(publicUser);
  });

  it('rejects duplicate e-mail addresses', async () => {
    repository.findUserByEmail.mockResolvedValue({} as never);

    await expect(
      service.register({
        email: publicUser.email,
        name: publicUser.name,
        password: 'Riddy@2026',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing or expired sessions', async () => {
    await expect(service.getSession(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    repository.findSession.mockResolvedValue(null);
    await expect(service.getSession('invalid')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuses to create a session for a suspended account', async () => {
    repository.findUserByEmail.mockResolvedValue({
      passwordHash: await import('./auth.crypto').then(({ hashPassword }) =>
        hashPassword('Riddy@2026'),
      ),
    } as never);
    repository.isUserActive.mockResolvedValue(false);

    await expect(
      service.login({ email: publicUser.email, password: 'Riddy@2026' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.createSession).not.toHaveBeenCalled();
  });

  it('creates a single-use recovery token without exposing whether an account exists', async () => {
    repository.findUserByEmail.mockResolvedValue({
      ...publicUser,
      bio: null,
      city: null,
      createdAt: new Date(),
      passwordHash: 'hash',
      phone: null,
      status: 'active',
      state: null,
      suspendedAt: null,
      suspensionReason: null,
      updatedAt: new Date(),
    });

    const result = await service.requestPasswordRecovery(publicUser.email);

    expect(result.message).toContain('Se existir uma conta');
    expect(result.developmentResetToken).toHaveLength(43);
    expect(repository.replacePasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        userId: publicUser.id,
      }),
    );
    expect(jobsQueue.enqueuePasswordRecovery).toHaveBeenCalledWith({
      email: publicUser.email,
      resetUrl: expect.stringMatching(
        /^http:\/\/localhost:3000\/redefinir-senha\?token=.+$/,
      ),
    });
  });

  it('rejects an invalid recovery token', async () => {
    repository.resetPassword.mockResolvedValue(false);

    await expect(
      service.confirmPasswordRecovery({
        password: 'NovaSenha@2026',
        token: 'invalid-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('keeps Google OAuth unavailable until credentials are configured', () => {
    expect(() => service.startGoogleOAuth()).toThrow(
      ServiceUnavailableException,
    );
  });
});
