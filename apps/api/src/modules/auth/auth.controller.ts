import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  googleCallbackPath,
  googleStateCookieName,
  googleVerifierCookieName,
  sessionCookieName,
} from './auth.constants';
import { CurrentUser } from './auth.decorators';
import {
  AuthResponseDto,
  ConfirmRecoveryDto,
  LoginDto,
  MessageResponseDto,
  RegisterDto,
  RequestRecoveryDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedSession, PublicUser } from './auth.types';
import { SessionAuthGuard } from './session-auth.guard';
import { TrustedOriginGuard } from './trusted-origin.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cria conta com e-mail e senha' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.register(input);
    this.setSessionCookie(reply, session);

    return { user: session.user };
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Autentica com e-mail e senha' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.login(input);
    this.setSessionCookie(reply, session);

    return { user: session.user };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Retorna o usuário da sessão atual' })
  @ApiOkResponse({ type: AuthResponseDto })
  me(@CurrentUser() user: PublicUser): AuthResponseDto {
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Encerra a sessão atual' })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MessageResponseDto> {
    await this.authService.logout(request.cookies[sessionCookieName]);
    reply.clearCookie(sessionCookieName, { path: '/' });

    return { message: 'Sessão encerrada.' };
  }

  @Post('recovery/request')
  @HttpCode(200)
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Solicita recuperação de senha' })
  @ApiBody({ type: RequestRecoveryDto })
  @ApiOkResponse({ type: MessageResponseDto })
  requestRecovery(
    @Body() input: RequestRecoveryDto,
  ): Promise<MessageResponseDto> {
    return this.authService.requestPasswordRecovery(input.email);
  }

  @Post('recovery/confirm')
  @HttpCode(200)
  @UseGuards(TrustedOriginGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Define nova senha com token válido' })
  @ApiBody({ type: ConfirmRecoveryDto })
  @ApiOkResponse({ type: MessageResponseDto })
  async confirmRecovery(
    @Body() input: ConfirmRecoveryDto,
  ): Promise<MessageResponseDto> {
    await this.authService.confirmPasswordRecovery(input);

    return { message: 'Senha atualizada. Entre novamente para continuar.' };
  }

  @Get('google')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Inicia o fluxo Google OAuth com PKCE' })
  google(@Res() reply: FastifyReply): void {
    const authorization = this.authService.startGoogleOAuth();
    const cookieOptions = this.oauthCookieOptions();
    reply.setCookie(googleStateCookieName, authorization.state, cookieOptions);
    reply.setCookie(
      googleVerifierCookieName,
      authorization.verifier,
      cookieOptions,
    );
    void reply.redirect(authorization.url, 302);
  }

  @Get('google/callback')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Conclui o fluxo Google OAuth' })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    try {
      if (!code || !state) {
        throw new Error('Missing OAuth callback parameters.');
      }

      const session = await this.authService.finishGoogleOAuth({
        code,
        expectedState: request.cookies[googleStateCookieName],
        state,
        verifier: request.cookies[googleVerifierCookieName],
      });
      this.clearOAuthCookies(reply);
      this.setSessionCookie(reply, session);
      void reply.redirect(this.authService.getWebUrl('/?auth=google'), 302);
    } catch {
      this.logger.warn('Google OAuth callback failed.');
      this.clearOAuthCookies(reply);
      void reply.redirect(
        this.authService.getWebUrl('/entrar?oauth=failed'),
        302,
      );
    }
  }

  private setSessionCookie(
    reply: FastifyReply,
    session: AuthenticatedSession,
  ): void {
    reply.setCookie(sessionCookieName, session.token, {
      expires: session.expiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: this.isProduction(),
    });
  }

  private oauthCookieOptions() {
    return {
      httpOnly: true,
      maxAge: 600,
      path: googleCallbackPath,
      sameSite: 'lax' as const,
      secure: this.isProduction(),
    };
  }

  private clearOAuthCookies(reply: FastifyReply): void {
    reply.clearCookie(googleStateCookieName, { path: googleCallbackPath });
    reply.clearCookie(googleVerifierCookieName, { path: googleCallbackPath });
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
