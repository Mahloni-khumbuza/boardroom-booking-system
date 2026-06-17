import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from '../amenities/entities/amenity.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { BoardroomBlock } from '../boardroom-blocks/entities/boardroom-block.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Boardroom } from './entities/boardroom.entity';
import { BoardroomAmenity } from './entities/boardroom-amenity.entity';
import { BoardroomsController } from './controllers/boardrooms.controller';
import { BoardroomsService } from './services/boardrooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Boardroom, BoardroomAmenity, Amenity, Booking, BoardroomBlock, AuditLog]), AuditLogsModule],
  controllers: [BoardroomsController],
  providers: [BoardroomsService],
  exports: [BoardroomsService, TypeOrmModule],
})
export class BoardroomsModule {}
