import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardroomsModule } from './boardrooms/boardrooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [AuthModule, UsersModule, BoardroomsModule, BookingsModule, AuditLogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
