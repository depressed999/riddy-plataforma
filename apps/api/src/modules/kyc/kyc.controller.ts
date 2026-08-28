import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { sessionCookieName } from '../auth/auth.constants';
import { CurrentUser } from '../auth/auth.decorators';
import type { PublicUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrustedOriginGuard } from '../auth/trusted-origin.guard';
import {
  CreateKycUploadDto,
  KycCaseDto,
  KycDocumentDto,
  KycUploadIntentDto,
  RejectKycCaseDto,
  SignedViewUrlDto,
} from './kyc.dto';
import { KycService } from './kyc.service';
import type {
  KycCase,
  KycDocument,
  ReviewKycCase,
  UploadIntent,
} from './kyc.types';

@ApiTags('kyc')
@ApiCookieAuth(sessionCookieName)
@Controller('kyc')
@UseGuards(SessionAuthGuard)
export class KycController {
  constructor(@Inject(KycService) private readonly kycService: KycService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna o processo KYC do usuário autenticado' })
  @ApiOkResponse({ type: KycCaseDto })
  getMine(@CurrentUser() user: PublicUser): Promise<KycCase | null> {
    return this.kycService.getMine(user.id);
  }

  @Post('documents/upload-url')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({
    summary: 'Cria uma autorização temporária de upload privado',
  })
  @ApiBody({ type: CreateKycUploadDto })
  @ApiCreatedResponse({ type: KycUploadIntentDto })
  createUploadIntent(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateKycUploadDto,
  ): Promise<UploadIntent> {
    return this.kycService.createUploadIntent(user.id, input);
  }

  @Post('documents/:id/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Valida e conclui um upload privado' })
  @ApiOkResponse({ type: KycDocumentDto })
  completeUpload(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<KycDocument> {
    return this.kycService.completeUpload(user.id, id);
  }

  @Get('documents/:id/view-url')
  @ApiOperation({ summary: 'Gera URL temporária para visualizar um documento' })
  @ApiOkResponse({ type: SignedViewUrlDto })
  getViewUrl(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ expiresInSeconds: number; url: string }> {
    return this.kycService.getViewUrl(user, id);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Remove um documento antes da análise' })
  async deleteDocument(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.kycService.deleteDocument(user.id, id);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Envia o processo KYC para análise' })
  @ApiOkResponse({ type: KycCaseDto })
  submit(@CurrentUser() user: PublicUser): Promise<KycCase> {
    return this.kycService.submit(user.id);
  }

  @Get('review/cases')
  @ApiOperation({ summary: 'Lista verificações pendentes para analistas' })
  @ApiOkResponse({ isArray: true, type: KycCaseDto })
  listPending(@CurrentUser() user: PublicUser): Promise<ReviewKycCase[]> {
    return this.kycService.listPending(user);
  }

  @Get('review/cases/:id')
  @ApiOperation({ summary: 'Carrega uma verificação para análise' })
  @ApiOkResponse({ type: KycCaseDto })
  getForReview(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ReviewKycCase> {
    return this.kycService.getForReview(user, id);
  }

  @Post('review/cases/:id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Aprova uma verificação pendente' })
  @ApiOkResponse({ type: KycCaseDto })
  approve(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ReviewKycCase> {
    return this.kycService.approve(user, id);
  }

  @Post('review/cases/:id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Rejeita uma verificação pendente' })
  @ApiBody({ type: RejectKycCaseDto })
  @ApiOkResponse({ type: KycCaseDto })
  reject(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: RejectKycCaseDto,
  ): Promise<ReviewKycCase> {
    return this.kycService.reject(user, id, input.reason);
  }
}
