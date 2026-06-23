import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from '../amenities/entities/amenity.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { BoardroomBlock } from '../boardroom-blocks/entities/boardroom-block.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Boardroom } from './entities/boardroom.entity';
import { BoardroomsController } from './controllers/boardrooms.controller';
import { BoardroomsService } from './services/boardrooms.service';
import { BoardroomProfile } from './profiles/boardroom.profile';

@Module({
  imports: [TypeOrmModule.forFeature([Boardroom, Amenity, Booking, BoardroomBlock, AuditLog]), AuditLogsModule],
  controllers: [BoardroomsController],
  providers: [BoardroomsService, BoardroomProfile],
  exports: [BoardroomsService, TypeOrmModule],
})
export class BoardroomsModule {}
