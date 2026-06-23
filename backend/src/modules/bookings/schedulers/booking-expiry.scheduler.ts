import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { Booking, BookingStatus } from '../entities/booking.entity';

@Injectable()
export class BookingExpiryScheduler {
  private readonly logger = new Logger(BookingExpiryScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // Runs every minute. Cancels any PENDING_APPROVAL booking whose start time
  // has already passed — there is no point approving a booking that is in the past.
  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingBookings(): Promise<void> {
    try {
      const now = new Date();

      const expired = await this.repo.find({
        where: { status: BookingStatus.PENDING_APPROVAL, startDateTime: LessThan(now) },
        select: ['id', 'title', 'bookedByUserId'],
      });

      if (expired.length === 0) return;

      await this.repo.update(
        expired.map((b) => b.id),
        {
          status: BookingStatus.CANCELLED,
          cancellationReason: 'Automatically cancelled — booking was not approved before its start time.',
          cancelledAt: now,
        },
      );

      for (const booking of expired) {
        void this.auditLogs.record({
          action: 'booking.auto_expired',
          entity: 'booking',
          entityId: booking.id,
          actorId: null,
          metadata: { reason: 'pending_approval_past_start' },
        });
      }

      this.logger.log(`Auto-expired ${expired.length} pending booking(s)`);
    } catch (err) {
      this.logger.error('Booking expiry scheduler error', err instanceof Error ? err.stack : String(err));
    }
  }
}
