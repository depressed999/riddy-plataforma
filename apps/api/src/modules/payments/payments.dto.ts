import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class PayerIdentificationDto {
  @ApiProperty({ example: 'CPF' })
  @IsString()
  @MaxLength(10)
  @MinLength(2)
  type!: string;

  @ApiProperty({ example: '12345678909' })
  @IsString()
  @Matches(/^\d{5,20}$/)
  number!: string;
}

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  bookingId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  idempotencyKey!: string;

  @ApiProperty({ example: 'visa' })
  @IsString()
  @Matches(/^[a-z0-9_-]{2,40}$/i)
  paymentMethodId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  token?: string;

  @ApiPropertyOptional({ maximum: 24, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Max(24)
  @Min(1)
  installments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  issuerId?: string;

  @ApiPropertyOptional({ type: PayerIdentificationDto })
  @IsOptional()
  @Type(() => PayerIdentificationDto)
  @ValidateNested()
  payerIdentification?: PayerIdentificationDto;
}

export class PaymentActionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  idempotencyKey!: string;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 1350 })
  amount!: number;

  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  @ApiProperty({ enum: ['card', 'pix'] })
  method!: string;

  @ApiProperty({ nullable: true })
  providerPaymentId!: string | null;

  @ApiProperty({
    enum: [
      'created',
      'pending',
      'in_process',
      'approved',
      'rejected',
      'cancelled',
      'refunded',
      'charged_back',
      'error',
    ],
  })
  status!: string;
}

export class PaymentContextResponseDto {
  @ApiProperty({ type: Object })
  booking!: object;

  @ApiProperty({ type: Object })
  mercadoPago!: object;

  @ApiProperty({ nullable: true, type: PaymentResponseDto })
  payment!: PaymentResponseDto | null;
}
