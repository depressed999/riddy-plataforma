import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import type {
  Vehicle,
  VehicleImage,
  VehicleLocation,
  PaginatedVehicles,
  PaginationMeta,
  VehicleStatus,
  VehicleType,
} from './vehicles.types';

export class SearchVehiclesQueryDto {
  @ApiProperty({ example: 'Elétrico', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  fuelType?: string;

  @ApiProperty({ example: 'Manaus', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiProperty({ example: 600, minimum: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ example: 200, minimum: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiProperty({ default: 1, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ default: 6, maximum: 24, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(24)
  @Min(1)
  pageSize = 6;

  @ApiProperty({ example: 'Tesla', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;

  @ApiProperty({ example: 5, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats?: number;

  @ApiProperty({
    default: 'newest',
    enum: ['newest', 'price_asc', 'price_desc'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['newest', 'price_asc', 'price_desc'])
  sort: 'newest' | 'price_asc' | 'price_desc' = 'newest';

  @ApiProperty({ example: 'Automático', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  transmission?: string;

  @ApiProperty({ enum: ['car', 'motorcycle'], required: false })
  @IsOptional()
  @IsEnum(['car', 'motorcycle'])
  type?: VehicleType;
}

export class VehicleImageResponseDto implements VehicleImage {
  @ApiProperty({ example: 'Tesla Model Y prata em uma garagem moderna.' })
  altText!: string;

  @ApiProperty({ example: 'a1111111-1111-4111-8111-111111111111' })
  id!: string;

  @ApiProperty({ example: true })
  isCover!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: 'vehicles/tesla-model-y.jpg' })
  storageKey!: string;
}

export class VehicleLocationResponseDto implements VehicleLocation {
  @ApiProperty({ example: 'Manaus' })
  city!: string;

  @ApiProperty({ example: -3.119 })
  latitude!: number;

  @ApiProperty({ example: -60.0217 })
  longitude!: number;

  @ApiProperty({ example: 'AM' })
  state!: string;
}

export class VehicleResponseDto implements Vehicle {
  @ApiProperty({
    example: ['Ar-condicionado', 'Bluetooth', 'Câmera de ré'],
    isArray: true,
    type: String,
  })
  amenities!: string[];

  @ApiProperty({ example: '2026-08-25T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: 450 })
  dailyRate!: number;

  @ApiProperty({ example: 'SUV elétrico confortável e espaçoso.' })
  description!: string;

  @ApiProperty({ example: 'Elétrico' })
  fuelType!: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  id!: string;

  @ApiProperty({ isArray: true, type: VehicleImageResponseDto })
  images!: VehicleImage[];

  @ApiProperty({ type: VehicleLocationResponseDto })
  location!: VehicleLocation;

  @ApiProperty({ example: 'Tesla' })
  make!: string;

  @ApiProperty({ example: 'Model Y' })
  model!: string;

  @ApiProperty({ example: '99999999-9999-4999-8999-999999999999' })
  ownerId!: string;

  @ApiProperty({ example: 5 })
  seats!: number;

  @ApiProperty({
    enum: ['draft', 'active', 'inactive', 'maintenance'],
    example: 'active',
  })
  status!: VehicleStatus;

  @ApiProperty({ example: 'Automático' })
  transmission!: string;

  @ApiProperty({ enum: ['car', 'motorcycle'], example: 'car' })
  type!: VehicleType;

  @ApiProperty({ example: '2026-08-25T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ example: 2023 })
  year!: number;
}

export class PaginationMetaResponseDto implements PaginationMeta {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 6 })
  pageSize!: number;

  @ApiProperty({ example: 8 })
  total!: number;

  @ApiProperty({ example: 2 })
  totalPages!: number;
}

export class PaginatedVehiclesResponseDto implements PaginatedVehicles {
  @ApiProperty({ isArray: true, type: VehicleResponseDto })
  items!: Vehicle[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta!: PaginationMeta;
}
