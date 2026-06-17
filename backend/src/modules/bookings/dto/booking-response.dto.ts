import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';
import { Booking, BookingStatus, MeetingType } from '../entities/booking.entity';

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
  startDateTime: Date;

  @ApiProperty()
  endDateTime: Date;

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

  @ApiProperty({ nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ type: BookingBoardroomDto, nullable: true })
  boardroom: BookingBoardroomDto | null;

  @ApiProperty({ type: BookingActorDto, nullable: true })
  bookedByUser: BookingActorDto | null;

  @ApiProperty({ type: BookingActorDto, nullable: true })
  approvedByUser: BookingActorDto | null;

  @ApiProperty({ nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ type: BookingActorDto, nullable: true })
  rejectedByUser: BookingActorDto | null;

  @ApiProperty({ nullable: true })
  rejectedAt: Date | null;

  @ApiProperty({ type: [AmenityResponseDto] })
  requestedAmenities: AmenityResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(booking: Booking): BookingResponseDto {
    const dto = new BookingResponseDto();
    dto.id = booking.id;
    dto.title = booking.title;
    dto.description = booking.description;
    dto.startDateTime = booking.startDateTime;
    dto.endDateTime = booking.endDateTime;
    dto.attendeeCount = booking.attendeeCount;
    dto.status = booking.status;
    dto.meetingType = booking.meetingType;
    dto.requiresCatering = booking.requiresCatering;
    dto.cateringNotes = booking.cateringNotes;
    dto.requiresSetup = booking.requiresSetup;
    dto.setupNotes = booking.setupNotes;
    dto.cancellationReason = booking.cancellationReason;
    dto.cancelledAt = booking.cancelledAt ?? null;
    dto.rejectionReason = booking.rejectionReason;
    dto.boardroom = booking.boardroom
      ? {
          id: booking.boardroom.id,
          name: booking.boardroom.name,
          location: booking.boardroom.location,
          capacity: booking.boardroom.capacity,
        }
      : null;
    dto.bookedByUser = booking.bookedByUser
      ? {
          id: booking.bookedByUser.id,
          email: booking.bookedByUser.email,
          firstName: booking.bookedByUser.firstName,
          lastName: booking.bookedByUser.lastName,
        }
      : null;
    dto.approvedByUser = booking.approvedByUser
      ? {
          id: booking.approvedByUser.id,
          email: booking.approvedByUser.email,
          firstName: booking.approvedByUser.firstName,
          lastName: booking.approvedByUser.lastName,
        }
      : null;
    dto.approvedAt = booking.approvedAt;
    dto.rejectedByUser = booking.rejectedByUser
      ? {
          id: booking.rejectedByUser.id,
          email: booking.rejectedByUser.email,
          firstName: booking.rejectedByUser.firstName,
          lastName: booking.rejectedByUser.lastName,
        }
      : null;
    dto.rejectedAt = booking.rejectedAt;
    dto.requestedAmenities = (booking.requestedAmenities ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    dto.createdAt = booking.createdAt;
    dto.updatedAt = booking.updatedAt;
    return dto;
  }

  static collection(bookings: Booking[]): BookingResponseDto[] {
    return bookings.map(BookingResponseDto.fromEntity);
  }
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
