import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JobsQueueService } from '../../infrastructure/jobs/jobs-queue.service';

import {
  createOpaqueToken,
  createPkceChallenge,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from './auth.crypto';
import { AuthRepository } from './auth.repository';
import type {
  AuthenticatedSession,
  GoogleAuthorization,
  GoogleProfile,
  PublicUser,
  RecoveryRequestResult,
} from './auth.types';

const recoveryMessage =
  'Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AuthRepository)
    private readonly authRepository: AuthRepository,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(JobsQueueService)
    private readonly jobsQueue: JobsQueueService,
  ) {}

  async register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<AuthenticatedSession> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.createUser({
      email,
      name: input.name.trim(),
      passwordHash,
    });

    return this.createSession(user);
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthenticatedSession> {
    const user = await this.authRepository.findUserByEmail(
      normalizeEmail(input.email),
    );

    if (!user?.passwordHash) {
      await hashPassword(input.password);
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const validPassword = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!validPassword) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.createSession({
      avatarUrl: user.avatarUrl,
      email: user.email,
      emailVerified: user.emailVerified,
      id: user.id,
      name: user.name,
      role: user.role,
    });
  }

  async getSession(token: string | undefined): Promise<PublicUser> {
    if (!token) {
      throw new UnauthorizedException('Sessão necessária.');
    }

    const session = await this.authRepository.findSession(
      hashOpaqueToken(token),
    );

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    await this.authRepository.touchSession(session.id);
    return session.user;
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) {
      await this.authRepository.deleteSession(hashOpaqueToken(token));
    }
  }

  async requestPasswordRecovery(
    emailInput: string,
  ): Promise<RecoveryRequestResult> {
    const user = await this.authRepository.findUserByEmail(
      normalizeEmail(emailInput),
    );

    if (!user || user.status === 'suspended') {
      return { message: recoveryMessage };
    }

    const token = createOpaqueToken();
    const ttlMinutes = this.getPositiveNumber('AUTH_RESET_TTL_MINUTES', 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    await this.authRepository.replacePasswordResetToken({
      expiresAt,
      tokenHash: hashOpaqueToken(token),
      userId: user.id,
    });

    await this.deliverRecoveryLink(user.email, token);

    const exposeDevelopmentToken =
      this.configService.get<string>('NODE_ENV', 'development') !==
        'production' &&
      this.configService.get<string>('AUTH_EXPOSE_RESET_TOKEN', 'false') ===
        'true';

    return {
      ...(exposeDevelopmentToken ? { developmentResetToken: token } : {}),
      message: recoveryMessage,
    };
  }

  async confirmPasswordRecovery(input: {
    password: string;
    token: string;
  }): Promise<void> {
    const passwordHash = await hashPassword(input.password);
    const updated = await this.authRepository.resetPassword({
      passwordHash,
      tokenHash: hashOpaqueToken(input.token),
    });

    if (!updated) {
      throw new UnauthorizedException(
        'O link de recuperação é inválido ou expirou.',
      );
    }
  }

  startGoogleOAuth(): GoogleAuthorization {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new ServiceUnavailableException(
        'O login com Google ainda não está configurado neste ambiente.',
      );
    }

    const state = createOpaqueToken();
    const verifier = createOpaqueToken();
    const query = new URLSearchParams({
      access_type: 'online',
      client_id: clientId,
      code_challenge: createPkceChallenge(verifier),
      code_challenge_method: 'S256',
      include_granted_scopes: 'true',
      prompt: 'select_account',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    return {
      state,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`,
      verifier,
    };
  }

  async finishGoogleOAuth(input: {
    code: string;
    expectedState: string | undefined;
    state: string;
    verifier: string | undefined;
  }): Promise<AuthenticatedSession> {
    if (
      !input.expectedState ||
      !input.verifier ||
      hashOpaqueToken(input.expectedState) !== hashOpaqueToken(input.state)
    ) {
      throw new UnauthorizedException('Estado OAuth inválido.');
    }

    const profile = await this.fetchGoogleProfile(input.code, input.verifier);
    const user = await this.authRepository.findOrCreateGoogleUser(profile);

    return this.createSession(user);
  }

  getWebUrl(path = ''): string {
    const webUrl = this.configService
      .get<string>('WEB_URL', 'http://localhost:3000')
      .replace(/\/$/, '');

    return `${webUrl}${path}`;
  }

  private async createSession(user: PublicUser): Promise<AuthenticatedSession> {
    if (!(await this.authRepository.isUserActive(user.id))) {
      throw new ForbiddenException(
        'Esta conta está suspensa. Entre em contato com o suporte.',
      );
    }

    const ttlDays = this.getPositiveNumber('AUTH_SESSION_TTL_DAYS', 30);
    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);
    await this.authRepository.createSession({
      expiresAt,
      tokenHash: hashOpaqueToken(token),
      userId: user.id,
    });

    return { expiresAt, token, user };
  }

  private async deliverRecoveryLink(
    email: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.getWebUrl('/redefinir-senha')}?token=${encodeURIComponent(token)}`;

    try {
      await this.jobsQueue.enqueuePasswordRecovery({ email, resetUrl });
    } catch {
      this.logger.error('Password recovery job could not be enqueued.');
    }
  }

  private async fetchGoogleProfile(
    code: string,
    verifier: string,
  ): Promise<GoogleProfile> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new ServiceUnavailableException(
        'O login com Google ainda não está configurado neste ambiente.',
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException(
        'Não foi possível autenticar com Google.',
      );
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenPayload.access_token) {
      throw new UnauthorizedException('Resposta OAuth inválida.');
    }

    const profileResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { authorization: `Bearer ${tokenPayload.access_token}` } },
    );

    if (!profileResponse.ok) {
      throw new UnauthorizedException(
        'Não foi possível obter o perfil Google.',
      );
    }

    const profile = (await profileResponse.json()) as {
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
      sub?: string;
    };

    if (
      !profile.sub ||
      !profile.email ||
      !profile.name ||
      profile.email_verified !== true
    ) {
      throw new UnauthorizedException(
        'Perfil Google incompleto ou não verificado.',
      );
    }

    return {
      email: normalizeEmail(profile.email),
      id: profile.sub,
      name: profile.name,
      picture: profile.picture ?? null,
    };
  }

  private getPositiveNumber(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key, String(fallback)));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
