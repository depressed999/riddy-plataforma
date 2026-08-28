import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

import type {
  Booking,
  BookingQuote,
  BookingStatus,
  BookingVehicle,
} from './bookings.types';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export class BookingDatesDto {
  @ApiProperty({ example: '2026-09-10', format: 'date' })
  @Matches(isoDatePattern, {
    message: 'pickupDate deve usar o formato YYYY-MM-DD',
  })
  pickupDate!: string;

  @ApiProperty({ example: '2026-09-13', format: 'date' })
  @Matches(isoDatePattern, {
    message: 'returnDate deve usar o formato YYYY-MM-DD',
  })
  returnDate!: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID('4')
  vehicleId!: string;
}

export class QuoteBookingQueryDto extends BookingDatesDto {}

export class CreateBookingDto extends BookingDatesDto {}

export class BookingQuoteResponseDto implements BookingQuote {
  @ApiProperty({ example: true })
  available!: boolean;

  @ApiProperty({ example: 'BRL' })
  currency!: 'BRL';

  @ApiProperty({ example: 350 })
  dailyRate!: number;

  @ApiProperty({ example: '2026-09-10', format: 'date' })
  pickupDate!: string;

  @ApiProperty({ example: '2026-09-13', format: 'date' })
  returnDate!: string;

  @ApiProperty({ example: 3 })
  totalDays!: number;

  @ApiProperty({ example: 1050 })
  totalPrice!: number;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  vehicleId!: string;
}

export class BookingVehicleResponseDto implements BookingVehicle {
  @ApiProperty({ example: 'Manaus' })
  city!: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  id!: string;

  @ApiProperty({ example: '/vehicles/tesla-model-y.jpg', nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ example: 'Tesla' })
  make!: string;

  @ApiProperty({ example: 'Model Y' })
  model!: string;

  @ApiProperty({ example: 'AM' })
  state!: string;

  @ApiProperty({ example: 2023 })
  year!: number;
}

export class BookingResponseDto implements Booking {
  @ApiProperty({ example: null, nullable: true })
  cancelledAt!: string | null;

  @ApiProperty({ example: '2026-08-25T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: 'BRL' })
  currency!: 'BRL';

  @ApiProperty({ example: 350 })
  dailyRate!: number;

  @ApiProperty({ example: '22222222-2222-4222-8222-222222222222' })
  id!: string;

  @ApiProperty({ example: '2026-09-10', format: 'date' })
  pickupDate!: string;

  @ApiProperty({ example: '33333333-3333-4333-8333-333333333333' })
  renterId!: string;

  @ApiProperty({ example: '2026-09-13', format: 'date' })
  returnDate!: string;

  @ApiProperty({
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    example: 'pending',
  })
  status!: BookingStatus;

  @ApiProperty({ example: 3 })
  totalDays!: number;

  @ApiProperty({ example: 1050 })
  totalPrice!: number;

  @ApiProperty({ example: '2026-08-25T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: BookingVehicleResponseDto })
  vehicle!: BookingVehicle;
}
