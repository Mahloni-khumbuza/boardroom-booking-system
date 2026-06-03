import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';
import { BookingStatus, MeetingType } from '../entities/booking.entity';

export class BookingBoardroomDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty()
  capacity: number;
}

export class BookingActorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  attendeeCount: number;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ enum: MeetingType })
  meetingType: MeetingType;

  @ApiProperty()
  requiresCatering: boolean;

  @ApiProperty({ nullable: true })
  cateringNotes: string | null;

  @ApiProperty()
  requiresSetup: boolean;

  @ApiProperty({ nullable: true })
  setupNotes: string | null;

  @ApiProperty({ nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ type: BookingBoardroomDto })
  boardroom: BookingBoardroomDto;

  @ApiProperty({ type: BookingActorDto, nullable: true })
  bookedBy: BookingActorDto | null;

  @ApiProperty({ type: BookingActorDto, nullable: true })
  approvedBy: BookingActorDto | null;

  @ApiProperty({ type: [AmenityResponseDto] })
  requestedAmenities: AmenityResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
