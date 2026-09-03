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
  Patch,
  Post,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
  CompleteVehicleImageUploadDto,
  CreateAvailabilityBlockDto,
  CreateHostVehicleDto,
  OnboardHostDto,
  PrepareVehicleImageUploadDto,
  ReorderVehicleImagesDto,
  UpdateHostProfileDto,
  UpdateHostVehicleDto,
  UpdateHostVehicleStatusDto,
} from './hosts.dto';
import { HostsService } from './hosts.service';
import type {
  HostAvailabilityBlock,
  HostBooking,
  HostDashboard,
  HostFinance,
  HostProfile,
  HostVehicle,
} from './hosts.types';

@ApiTags('hosts')
@ApiCookieAuth(sessionCookieName)
@Controller('hosts')
@UseGuards(SessionAuthGuard)
export class HostsController {
  constructor(
    @Inject(HostsService) private readonly hostsService: HostsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna visão geral da área do anfitrião' })
  @ApiOkResponse()
  getDashboard(@CurrentUser() user: PublicUser): Promise<HostDashboard> {
    return this.hostsService.getDashboard(user.id);
  }

  @Post('onboarding')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Cria ou retoma o perfil de anfitrião' })
  @ApiBody({ type: OnboardHostDto })
  @ApiCreatedResponse()
  onboard(
    @CurrentUser() user: PublicUser,
    @Body() input: OnboardHostDto,
  ): Promise<HostProfile> {
    return this.hostsService.onboard(user.id, input);
  }

  @Patch('profile')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Atualiza as configurações do anfitrião' })
  @ApiBody({ type: UpdateHostProfileDto })
  @ApiOkResponse()
  updateProfile(
    @CurrentUser() user: PublicUser,
    @Body() input: UpdateHostProfileDto,
  ): Promise<HostProfile> {
    return this.hostsService.updateProfile(user.id, input);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Lista veículos pertencentes ao anfitrião' })
  @ApiOkResponse({ isArray: true })
  listVehicles(@CurrentUser() user: PublicUser): Promise<HostVehicle[]> {
    return this.hostsService.listVehicles(user.id);
  }

  @Post('vehicles')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Cadastra um veículo em rascunho' })
  @ApiBody({ type: CreateHostVehicleDto })
  @ApiCreatedResponse()
  createVehicle(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateHostVehicleDto,
  ): Promise<HostVehicle> {
    return this.hostsService.createVehicle(user.id, input);
  }

  @Patch('vehicles/:id')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Atualiza um veículo do anfitrião' })
  @ApiBody({ type: UpdateHostVehicleDto })
  @ApiOkResponse()
  updateVehicle(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateHostVehicleDto,
  ): Promise<HostVehicle> {
    return this.hostsService.updateVehicle(user.id, id, input);
  }

  @Patch('vehicles/:id/status')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Altera a disponibilidade pública do veículo' })
  @ApiBody({ type: UpdateHostVehicleStatusDto })
  @ApiOkResponse()
  updateVehicleStatus(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateHostVehicleStatusDto,
  ): Promise<HostVehicle> {
    return this.hostsService.updateVehicleStatus(user.id, id, input);
  }

  @Post('vehicles/:id/images/upload-url')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Prepara o envio direto de uma foto do veículo' })
  @ApiBody({ type: PrepareVehicleImageUploadDto })
  @ApiCreatedResponse()
  prepareVehicleImageUpload(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: PrepareVehicleImageUploadDto,
  ) {
    return this.hostsService.prepareVehicleImageUpload(user.id, id, input);
  }

  @Post('vehicles/:id/images/complete')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Valida e adiciona a foto enviada ao veículo' })
  @ApiBody({ type: CompleteVehicleImageUploadDto })
  @ApiCreatedResponse()
  completeVehicleImageUpload(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CompleteVehicleImageUploadDto,
  ): Promise<HostVehicle> {
    return this.hostsService.completeVehicleImageUpload(user.id, id, input);
  }

  @Get('vehicles/:id/images/:imageId/content')
  @Redirect('', HttpStatus.FOUND)
  @ApiOperation({ summary: 'Abre uma foto do próprio veículo' })
  async getVehicleImageContent(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
  ): Promise<{ url: string }> {
    return {
      url: await this.hostsService.vehicleImageContentUrl(user.id, id, imageId),
    };
  }

  @Patch('vehicles/:id/images/order')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Reordena todas as fotos do veículo' })
  @ApiBody({ type: ReorderVehicleImagesDto })
  @ApiOkResponse()
  reorderVehicleImages(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ReorderVehicleImagesDto,
  ): Promise<HostVehicle> {
    return this.hostsService.reorderVehicleImages(user.id, id, input.imageIds);
  }

  @Patch('vehicles/:id/images/:imageId/cover')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Define a foto de capa do veículo' })
  @ApiOkResponse()
  setVehicleImageCover(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
  ): Promise<HostVehicle> {
    return this.hostsService.setVehicleImageCover(user.id, id, imageId);
  }

  @Delete('vehicles/:id/images/:imageId')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Remove uma foto do veículo' })
  @ApiOkResponse()
  deleteVehicleImage(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
  ): Promise<HostVehicle> {
    return this.hostsService.deleteVehicleImage(user.id, id, imageId);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Lista reservas dos veículos do anfitrião' })
  @ApiOkResponse({ isArray: true })
  listBookings(@CurrentUser() user: PublicUser): Promise<HostBooking[]> {
    return this.hostsService.listBookings(user.id);
  }

  @Get('availability-blocks')
  @ApiOperation({ summary: 'Lista bloqueios de calendário do anfitrião' })
  @ApiOkResponse({ isArray: true })
  listAvailabilityBlocks(
    @CurrentUser() user: PublicUser,
  ): Promise<HostAvailabilityBlock[]> {
    return this.hostsService.listAvailabilityBlocks(user.id);
  }

  @Post('availability-blocks')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Bloqueia um período no calendário do veículo' })
  @ApiBody({ type: CreateAvailabilityBlockDto })
  @ApiCreatedResponse()
  createAvailabilityBlock(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateAvailabilityBlockDto,
  ): Promise<HostAvailabilityBlock> {
    return this.hostsService.createAvailabilityBlock(user.id, input);
  }

  @Delete('availability-blocks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Remove um bloqueio de calendário próprio' })
  @ApiNoContentResponse()
  deleteAvailabilityBlock(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.hostsService.deleteAvailabilityBlock(user.id, id);
  }

  @Get('finance')
  @ApiOperation({ summary: 'Retorna o resumo financeiro bruto do anfitrião' })
  @ApiOkResponse()
  getFinance(@CurrentUser() user: PublicUser): Promise<HostFinance> {
    return this.hostsService.getFinance(user.id);
  }
}
