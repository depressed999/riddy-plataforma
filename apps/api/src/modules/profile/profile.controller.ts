import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { sessionCookieName } from '../auth/auth.constants';
import { CurrentUser } from '../auth/auth.decorators';
import type { PublicUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrustedOriginGuard } from '../auth/trusted-origin.guard';
import { UpdateProfileDto, UserProfileDto } from './profile.dto';
import { ProfileService } from './profile.service';
import type { UserProfile } from './profile.types';

@ApiTags('profile')
@ApiCookieAuth(sessionCookieName)
@Controller('profile')
@UseGuards(SessionAuthGuard)
export class ProfileController {
  constructor(
    @Inject(ProfileService)
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Retorna o perfil básico do usuário autenticado' })
  @ApiOkResponse({ type: UserProfileDto })
  getProfile(@CurrentUser() user: PublicUser): Promise<UserProfile> {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Atualiza o perfil básico do usuário autenticado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: UserProfileDto })
  updateProfile(
    @CurrentUser() user: PublicUser,
    @Body() input: UpdateProfileDto,
  ): Promise<UserProfile> {
    return this.profileService.updateProfile(user.id, input);
  }
}
