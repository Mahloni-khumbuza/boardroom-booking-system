import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from '../amenities/entities/amenity.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { BoardroomBlock } from '../boardroom-blocks/entities/boardroom-block.entity';
import { BoardroomsService } from './services/boardrooms.service';
import { BoardroomsController } from './controllers/boardrooms.controller';
import { Boardroom } from './entities/boardroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boardroom, Amenity, Booking, BoardroomBlock])],
  providers: [BoardroomsService],
  controllers: [BoardroomsController],
  exports: [TypeOrmModule, BoardroomsService],
})
export class BoardroomsModule {}
