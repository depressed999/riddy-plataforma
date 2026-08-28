import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import type {
  AdminUserRole,
  AdminUserStatus,
  AdminVehicleStatus,
} from './admin.types';

export class AdminListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class AdminReasonDto {
  @ApiProperty({ example: 'Ação confirmada após revisão do atendimento.' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}

export class UpdateAdminUserRoleDto extends AdminReasonDto {
  @ApiProperty({ enum: ['user', 'reviewer', 'admin'] })
  @IsEnum(['user', 'reviewer', 'admin'])
  role!: AdminUserRole;
}

export class UpdateAdminUserStatusDto extends AdminReasonDto {
  @ApiProperty({ enum: ['active', 'suspended'] })
  @IsEnum(['active', 'suspended'])
  status!: AdminUserStatus;
}

export class UpdateAdminVehicleStatusDto extends AdminReasonDto {
  @ApiProperty({ enum: ['draft', 'active', 'inactive', 'maintenance'] })
  @IsEnum(['draft', 'active', 'inactive', 'maintenance'])
  status!: AdminVehicleStatus;
}
