import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PushTokenPlatform } from '../entities/push-token.entity';

export class RegisterTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @ApiProperty({ enum: PushTokenPlatform, default: PushTokenPlatform.Expo })
  @IsEnum(PushTokenPlatform)
  platform: PushTokenPlatform;

  @ApiPropertyOptional({ description: 'Unique device identifier for token refresh tracking' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceId?: string;
}
