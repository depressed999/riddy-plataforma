import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import type { VehicleStatus, VehicleType } from '../vehicles/vehicles.types';

export class OnboardHostDto {
  @ApiProperty({ example: 'Nycolas Mobilidade', maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: '+5592999999999', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^$|^[+0-9() .-]{8,24}$/)
  supportPhone?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  acceptTerms!: boolean;
}

export class UpdateHostProfileDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^$|^[+0-9() .-]{8,24}$/)
  supportPhone?: string;
}

export class CreateHostVehicleDto {
  @ApiProperty({ enum: ['car', 'motorcycle'] })
  @IsEnum(['car', 'motorcycle'])
  type!: VehicleType;

  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  make!: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model!: string;

  @ApiProperty({ maximum: 2100, minimum: 1950 })
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  year!: number;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(30)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  dailyRate!: number;

  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MaxLength(40)
  transmission!: string;

  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MaxLength(40)
  fuelType!: string;

  @ApiProperty({ maximum: 12, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  seats!: number;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'AM' })
  @IsString()
  @Matches(/^[A-Za-z]{2}$/)
  state!: string;

  @ApiProperty({ maximum: 90, minimum: -90 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ maximum: 180, minimum: -180 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ isArray: true, maxItems: 24, type: String })
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  amenities!: string[];
}

export class UpdateHostVehicleDto {
  @ApiPropertyOptional({ enum: ['car', 'motorcycle'] })
  @IsOptional()
  @IsEnum(['car', 'motorcycle'])
  type?: VehicleType;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  make?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model?: string;

  @ApiPropertyOptional({ maximum: 2100, minimum: 1950 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MinLength(30)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  dailyRate?: number;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  transmission?: string;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  fuelType?: string;

  @ApiPropertyOptional({ maximum: 12, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  seats?: number;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'AM' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/)
  state?: string;

  @ApiPropertyOptional({ maximum: 90, minimum: -90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ maximum: 180, minimum: -180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ isArray: true, maxItems: 24, type: String })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  amenities?: string[];
}

export class UpdateHostVehicleStatusDto {
  @ApiProperty({ enum: ['draft', 'active', 'inactive', 'maintenance'] })
  @IsEnum(['draft', 'active', 'inactive', 'maintenance'])
  status!: VehicleStatus;
}

export class PrepareVehicleImageUploadDto {
  @ApiProperty({ example: 'frente-do-veiculo.jpg', maxLength: 180 })
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  fileName!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsEnum(['image/jpeg', 'image/png', 'image/webp'])
  mimeType!: 'image/jpeg' | 'image/png' | 'image/webp';

  @ApiProperty({ maximum: 8_388_608, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8_388_608)
  sizeBytes!: number;

  @ApiPropertyOptional({ maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;
}

export class CompleteVehicleImageUploadDto {
  @ApiProperty({ maxLength: 512 })
  @IsString()
  @MaxLength(512)
  storageKey!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsEnum(['image/jpeg', 'image/png', 'image/webp'])
  mimeType!: 'image/jpeg' | 'image/png' | 'image/webp';

  @ApiProperty({ maximum: 8_388_608, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8_388_608)
  sizeBytes!: number;

  @ApiPropertyOptional({ maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;
}

export class ReorderVehicleImagesDto {
  @ApiProperty({ format: 'uuid', isArray: true, maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  imageIds!: string[];
}

export class CreateAvailabilityBlockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  vehicleId!: string;

  @ApiProperty({ example: '2026-09-10', format: 'date' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({ example: '2026-09-15', format: 'date' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @ApiPropertyOptional({ maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;
}
