import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { BookingsService } from './bookings.service';

@Injectable()
export class BookingReminderService {
  private readonly logger = new Logger(BookingReminderService.name);

  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async processReminders(): Promise<void> {
    this.logger.log('Running booking reminder job...');

    try {
      const result = await this.bookingsService.sendDueReminders();

      this.logger.log(
        `Reminders processed. Sent=${result.sent}, Failed=${result.failed}, Skipped=${result.skipped}`,
      );
    } catch (error) {
      this.logger.error('Reminder job failed', error);
    }
  }
}