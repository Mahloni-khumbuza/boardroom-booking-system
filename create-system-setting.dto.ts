import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSystemSettingDto {
  @ApiProperty({ example: 'booking.max_advance_days' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9._-]*$/, {
    message: 'key must be lowercase, may contain digits, dots, hyphens, underscores',
  })
  key: string;

  @ApiProperty({ example: '30', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  value?: string;

  @ApiProperty({ example: 'Maximum days in advance a booking can be made', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
