import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class RoomUtilisationDto {
  @ApiProperty()
  boardroomId: string;

  @ApiProperty()
  boardroomName: string;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  totalBookedMinutes: number;

  @ApiProperty({ description: 'Percentage of available operating-hours minutes that were booked' })
  utilisationPct: number;
}

export class BookingsByDepartmentDto {
  @ApiProperty()
  department: string;

  @ApiProperty()
  bookingCount: number;
}

export class PeakHourDto {
  @ApiProperty({ description: 'Hour of day 0–23' })
  hour: number;

  @ApiProperty()
  bookingCount: number;
}

export class RoomUsageRankDto {
  @ApiProperty()
  boardroomId: string;

  @ApiProperty()
  boardroomName: string;

  @ApiProperty()
  bookingCount: number;
}

export class CancellationReportDto {
  @ApiProperty()
  totalCancelled: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty({ description: 'Cancellation rate as a percentage' })
  cancellationRatePct: number;

  @ApiProperty({ description: 'Bookings confirmed but never completed (no-show estimate)' })
  noShowEstimate: number;
}

export class ReportingQueryDto {
  @ApiPropertyOptional({ description: 'ISO date — start of reporting window' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date — end of reporting window' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
