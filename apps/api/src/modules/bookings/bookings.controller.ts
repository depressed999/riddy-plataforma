import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { sessionCookieName } from '../auth/auth.constants';
import { CurrentUser } from '../auth/auth.decorators';
import type { PublicUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrustedOriginGuard } from '../auth/trusted-origin.guard';
import {
  BookingQuoteResponseDto,
  BookingResponseDto,
  CreateBookingDto,
  QuoteBookingQueryDto,
} from './bookings.dto';
import { BookingsService } from './bookings.service';
import type { Booking, BookingQuote } from './bookings.types';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    @Inject(BookingsService)
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('quote')
  @ApiOperation({ summary: 'Calcula preço e disponibilidade para um período' })
  @ApiQuery({ type: QuoteBookingQueryDto })
  @ApiOkResponse({ type: BookingQuoteResponseDto })
  quote(@Query() query: QuoteBookingQueryDto): Promise<BookingQuote> {
    return this.bookingsService.quote(query);
  }

  @Get('mine')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Lista as reservas do usuário autenticado' })
  @ApiOkResponse({ isArray: true, type: BookingResponseDto })
  listMine(@CurrentUser() user: PublicUser): Promise<Booking[]> {
    return this.bookingsService.listMine(user.id);
  }

  @Post()
  @UseGuards(SessionAuthGuard, TrustedOriginGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Cria uma reserva pendente sem realizar cobrança' })
  @ApiBody({ type: CreateBookingDto })
  @ApiCreatedResponse({ type: BookingResponseDto })
  @ApiConflictResponse({ description: 'Período indisponível.' })
  create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.create(input, user.id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard, TrustedOriginGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({
    summary: 'Cancela uma reserva futura do usuário autenticado',
  })
  @ApiParam({ format: 'uuid', name: 'id' })
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Booking> {
    return this.bookingsService.cancel(id, user.id);
  }
}
