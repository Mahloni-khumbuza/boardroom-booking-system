import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-06-04', description: 'Date in YYYY-MM-DD format' })
  @IsDateString()
  date: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityResponseDto {
  boardroomId: string;
  date: string;
  openingTime: string;
  closingTime: string;
  slots: TimeSlot[];
}
