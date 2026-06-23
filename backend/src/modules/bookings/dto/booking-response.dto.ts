import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';
import { BookingStatus, MeetingType } from '../entities/booking.entity';

export class BookingBoardroomDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  name: string;

  @AutoMap()
  @ApiProperty({ nullable: true })
  location: string | null;

  @AutoMap()
  @ApiProperty()
  capacity: number;
}

export class BookingActorDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  email: string;

  @AutoMap()
  @ApiProperty()
  firstName: string;

  @AutoMap()
  @ApiProperty()
  lastName: string;
}

export class BookingResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  title: string;

  @AutoMap()
  @ApiProperty({ nullable: true })
  description: string | null;

  @AutoMap()
  @ApiProperty()
  startDateTime: Date;

  @AutoMap()
  @ApiProperty()
  endDateTime: Date;

  @AutoMap()
  @ApiProperty()
  attendeeCount: number;

  @AutoMap()
  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @AutoMap()
  @ApiProperty({ enum: MeetingType })
  meetingType: MeetingType;

  @AutoMap()
  @ApiProperty()
  requiresCatering: boolean;

  @AutoMap()
  @ApiProperty({ nullable: true })
  cateringNotes: string | null;

  @AutoMap()
  @ApiProperty()
  requiresSetup: boolean;

  @AutoMap()
  @ApiProperty({ nullable: true })
  setupNotes: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  cancellationReason: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  rejectionReason: string | null;

  @AutoMap()
  @ApiProperty({ type: BookingBoardroomDto, nullable: true })
  boardroom: BookingBoardroomDto | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  bookedByUserId: string | null;

  @AutoMap()
  @ApiProperty({ type: BookingActorDto, nullable: true })
  bookedByUser: BookingActorDto | null;

  @AutoMap()
  @ApiProperty({ type: BookingActorDto, nullable: true })
  approvedByUser: BookingActorDto | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  approvedAt: Date | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @AutoMap()
  @ApiProperty({ type: BookingActorDto, nullable: true })
  rejectedByUser: BookingActorDto | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  rejectedAt: Date | null;

  @AutoMap()
  @ApiProperty({ type: [AmenityResponseDto] })
  requestedAmenities: AmenityResponseDto[];

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}

export class CalendarEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  start: Date | string;

  @ApiProperty()
  end: Date | string;

  @ApiProperty()
  status: string;

  @ApiProperty({ nullable: true })
  boardroomId: string | null;

  @ApiProperty({ nullable: true })
  boardroom: string | null;

  @ApiProperty()
  owner: string;
}
