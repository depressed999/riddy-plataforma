import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { kycDocumentTypes, type KycDocumentType } from './kyc.types';

export class CreateKycUploadDto {
  @ApiProperty({ enum: kycDocumentTypes })
  @IsIn(kycDocumentTypes)
  type!: KycDocumentType;

  @ApiProperty({ example: 'cnh-frente.jpg', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'application/pdf'] })
  @IsIn(['image/jpeg', 'image/png', 'application/pdf'])
  mimeType!: string;

  @ApiProperty({ example: 524288 })
  @IsInt()
  @Min(1)
  @Max(8 * 1024 * 1024)
  sizeBytes!: number;
}

export class RejectKycCaseDto {
  @ApiProperty({ maxLength: 500, minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}

export class KycDocumentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: kycDocumentTypes })
  type!: KycDocumentType;

  @ApiProperty()
  originalName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty({
    enum: [
      'upload_pending',
      'uploaded',
      'pending_review',
      'approved',
      'rejected',
    ],
  })
  status!:
    'approved' | 'pending_review' | 'rejected' | 'upload_pending' | 'uploaded';

  @ApiProperty({ nullable: true })
  uploadedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class KycCaseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['draft', 'pending_review', 'approved', 'rejected'],
  })
  status!: 'approved' | 'draft' | 'pending_review' | 'rejected';

  @ApiProperty({ nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({ isArray: true, type: KycDocumentDto })
  documents!: KycDocumentDto[];

  @ApiProperty({ nullable: true })
  submittedAt!: string | null;

  @ApiProperty({ nullable: true })
  reviewedAt!: string | null;
}

export class KycUploadIntentDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ additionalProperties: { type: 'string' }, type: 'object' })
  headers!: Record<string, string>;

  @ApiProperty({ type: KycDocumentDto })
  document!: KycDocumentDto;
}

export class SignedViewUrlDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  expiresInSeconds!: number;
}
