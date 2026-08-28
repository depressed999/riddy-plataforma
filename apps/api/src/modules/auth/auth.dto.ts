import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export class RegisterDto {
  @ApiProperty({ example: 'Nycolas Silva', maxLength: 120, minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'nycolas@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'Riddy@2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(passwordPattern, {
    message: 'password must contain a letter, a number and a symbol',
  })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'nycolas@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'Riddy@2026' })
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RequestRecoveryDto {
  @ApiProperty({ example: 'nycolas@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class ConfirmRecoveryDto {
  @ApiProperty({ description: 'Token recebido no fluxo de recuperação' })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @ApiProperty({ example: 'NovaSenha@2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(passwordPattern, {
    message: 'password must contain a letter, a number and a symbol',
  })
  password!: string;
}

export class PublicUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ enum: ['user', 'reviewer', 'admin'] })
  role!: 'admin' | 'reviewer' | 'user';
}

export class AuthResponseDto {
  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({
    description: 'Disponível somente com opt-in explícito em desenvolvimento',
  })
  developmentResetToken?: string;
}
