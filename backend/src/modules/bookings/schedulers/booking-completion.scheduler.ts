import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { Booking, BookingStatus } from '../entities/booking.entity';

@Injectable()
export class BookingCompletionScheduler {
  private readonly logger = new Logger(BookingCompletionScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // Runs every minute. Marks APPROVED bookings as COMPLETED once their end
  // time has passed, so dashboards and reports reflect accurate state.
  @Cron(CronExpression.EVERY_MINUTE)
  async completeFinishedBookings(): Promise<void> {
    try {
      const now = new Date();

      const finished = await this.repo.find({
        where: { status: BookingStatus.APPROVED, endDateTime: LessThan(now) },
        select: ['id', 'title', 'bookedByUserId'],
      });

      if (finished.length === 0) return;

      await this.repo.update(
        finished.map((b) => b.id),
        { status: BookingStatus.COMPLETED },
      );

      for (const booking of finished) {
        void this.auditLogs.record({
          action: 'booking.auto_completed',
          entity: 'booking',
          entityId: booking.id,
          actorId: null,
          metadata: { completedAt: now.toISOString() },
        });
      }

      this.logger.log(`Auto-completed ${finished.length} approved booking(s)`);
    } catch (err) {
      this.logger.error('Booking completion scheduler error', err instanceof Error ? err.stack : String(err));
    }
  }
}
