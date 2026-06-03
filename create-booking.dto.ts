import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Q2 Strategy Review' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Boardroom UUID' })
  @IsUUID('4')
  boardroomId: string;

  @ApiProperty({ description: 'ISO 8601 start time' })
  @IsISO8601()
  startTime: string;

  @ApiProperty({ description: 'ISO 8601 end time' })
  @IsISO8601()
  endTime: string;

  @ApiProperty({ example: 4, description: 'Expected number of attendees' })
  @IsInt()
  @Min(1)
  @Max(1000)
  attendeeCount: number;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Amenity UUIDs requested for this meeting (must be a subset of the boardroom\'s amenities)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  requestedAmenityIds?: string[];
}
