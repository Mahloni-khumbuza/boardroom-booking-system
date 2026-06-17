import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectBookingDto {
  @ApiProperty({ example: 'Room is unavailable for that period.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Plans changed.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
