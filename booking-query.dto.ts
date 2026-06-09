import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class BookingQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  boardroomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  bookedById?: string;

  @ApiPropertyOptional({ description: 'Restrict to bookings owned by the current user' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true ? true : value === 'false' || value === false ? false : value,
  )
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ description: 'ISO 8601 lower bound on end time' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 upper bound on start time' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
