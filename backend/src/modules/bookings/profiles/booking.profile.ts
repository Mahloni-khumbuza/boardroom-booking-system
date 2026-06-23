import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { mapFrom } from '@automapper/core';
import { Mapper, MappingProfile } from '@automapper/core';
import { Booking } from '../entities/booking.entity';
import { BookingActorDto, BookingBoardroomDto, BookingResponseDto } from '../dto/booking-response.dto';

@Injectable()
export class BookingProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper
        .createMap(Booking, BookingResponseDto)
        .forMember(
          (d) => d.boardroom,
          mapFrom((s) =>
            s.boardroom
              ? Object.assign(new BookingBoardroomDto(), {
                  id: s.boardroom.id,
                  name: s.boardroom.name,
                  location: s.boardroom.location,
                  capacity: s.boardroom.capacity,
                })
              : null,
          ),
        )
        .forMember(
          (d) => d.bookedByUser,
          mapFrom((s) =>
            s.bookedByUser
              ? Object.assign(new BookingActorDto(), {
                  id: s.bookedByUser.id,
                  email: s.bookedByUser.email,
                  firstName: s.bookedByUser.firstName,
                  lastName: s.bookedByUser.lastName,
                })
              : null,
          ),
        )
        .forMember(
          (d) => d.approvedByUser,
          mapFrom((s) =>
            s.approvedByUser
              ? Object.assign(new BookingActorDto(), {
                  id: s.approvedByUser.id,
                  email: s.approvedByUser.email,
                  firstName: s.approvedByUser.firstName,
                  lastName: s.approvedByUser.lastName,
                })
              : null,
          ),
        )
        .forMember(
          (d) => d.rejectedByUser,
          mapFrom((s) =>
            s.rejectedByUser
              ? Object.assign(new BookingActorDto(), {
                  id: s.rejectedByUser.id,
                  email: s.rejectedByUser.email,
                  firstName: s.rejectedByUser.firstName,
                  lastName: s.rejectedByUser.lastName,
                })
              : null,
          ),
        );
    };
  }
}
