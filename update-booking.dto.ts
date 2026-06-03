import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';

export class UpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['boardroomId'] as const),
) {}
