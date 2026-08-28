import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/auth.decorators';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrustedOriginGuard } from '../auth/trusted-origin.guard';
import type { PublicUser } from '../auth/auth.types';
// These classes must remain runtime values so Nest can emit validation metadata.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  AdminListQueryDto,
  UpdateAdminUserRoleDto,
  UpdateAdminUserStatusDto,
  UpdateAdminVehicleStatusDto,
} from './admin.dto';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly service: AdminService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Obtém os indicadores operacionais da administração',
  })
  dashboard() {
    return this.service.dashboard();
  }

  @Get('users')
  listUsers(@Query() query: AdminListQueryDto) {
    return this.service.listUsers(query);
  }

  @Patch('users/:id/role')
  @UseGuards(TrustedOriginGuard)
  updateUserRole(
    @CurrentUser() actor: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateAdminUserRoleDto,
  ) {
    return this.service.updateUserRole(actor.id, id, input.role, input.reason);
  }

  @Patch('users/:id/status')
  @UseGuards(TrustedOriginGuard)
  updateUserStatus(
    @CurrentUser() actor: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateAdminUserStatusDto,
  ) {
    return this.service.updateUserStatus(
      actor.id,
      id,
      input.status,
      input.reason,
    );
  }

  @Get('vehicles')
  listVehicles(@Query() query: AdminListQueryDto) {
    return this.service.listVehicles(query);
  }

  @Patch('vehicles/:id/status')
  @UseGuards(TrustedOriginGuard)
  updateVehicleStatus(
    @CurrentUser() actor: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateAdminVehicleStatusDto,
  ) {
    return this.service.updateVehicleStatus(
      actor.id,
      id,
      input.status,
      input.reason,
    );
  }

  @Get('bookings')
  listBookings(@Query() query: AdminListQueryDto) {
    return this.service.listBookings(query);
  }

  @Get('payments')
  listPayments(@Query() query: AdminListQueryDto) {
    return this.service.listPayments(query);
  }

  @Get('audit')
  listAudit(@Query() query: AdminListQueryDto) {
    return this.service.listAudit(query);
  }
}
