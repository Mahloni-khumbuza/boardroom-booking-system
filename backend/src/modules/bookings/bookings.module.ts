import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardroomBlock } from '../boardroom-blocks/entities/boardroom-block.entity';
import { Boardroom } from '../boardrooms/entities/boardroom.entity';
import { User } from '../users/entities/user.entity';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './services/bookings.service';
import { BookingsController } from './controllers/bookings.controller';
import { BookingReminderScheduler } from './schedulers/booking-reminder.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SharedServicesModule } from '../../shared/services/shared-services.module';

import { BookingReminderService } from './services/booking-reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Boardroom, BoardroomBlock, User]),
    NotificationsModule,
    AuditLogsModule,
    SharedServicesModule,
  ],
  providers: [BookingsService, 
    BookingReminderScheduler,
    BookingReminderService,
    ],
  controllers: [BookingsController],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
