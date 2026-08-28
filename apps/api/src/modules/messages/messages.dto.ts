import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  bookingId!: string;
}

export class SendMessageDto {
  @ApiProperty({ maxLength: 2000, minLength: 1 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
