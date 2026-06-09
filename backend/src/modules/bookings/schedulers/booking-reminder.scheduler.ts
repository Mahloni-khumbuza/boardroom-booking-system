import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MailService } from '../../mail/mail.service';
import { bookingReminderHtml } from '../../mail/mail-templates';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SystemSettingsService } from '../../system-settings/services/system-settings.service';
import { Booking, BookingStatus } from '../entities/booking.entity';

const DEFAULT_REMINDER_MINUTES = 30;

@Injectable()
export class BookingReminderScheduler {
  private readonly logger = new Logger(BookingReminderScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly settings: SystemSettingsService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders(): Promise<void> {
    try {
      const setting = await this.settings.findByKey('booking.reminder_minutes');
      const reminderMinutes = setting?.value ? Number(setting.value) : DEFAULT_REMINDER_MINUTES;
      if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) return;

      const now = new Date();
      const windowStart = new Date(now.getTime() + reminderMinutes * 60_000 - 30_000);
      const windowEnd = new Date(now.getTime() + reminderMinutes * 60_000 + 30_000);

      const upcoming = await this.repo.find({
        where: {
          status: BookingStatus.Confirmed,
          startTime: Between(windowStart, windowEnd),
        },
        relations: { bookedBy: true, boardroom: true },
      });

      for (const booking of upcoming) {
        if (!booking.bookedBy?.email) continue;
        const ctx = {
          userName: `${booking.bookedBy.firstName} ${booking.bookedBy.lastName}`,
          boardroomName: booking.boardroom?.name ?? 'Unknown',
          bookingTitle: booking.title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          reminderMinutes,
        };
        await this.mail.sendMail({
          to: booking.bookedBy.email,
          subject: `Reminder: "${booking.title}" starts in ${reminderMinutes} minutes`,
          html: bookingReminderHtml(ctx),
        });
        if (booking.bookedById) {
          await this.notifications.notify({
            recipientId: booking.bookedById,
            type: NotificationType.BookingReminder,
            title: `Reminder: booking in ${reminderMinutes} min`,
            message: `"${booking.title}" in ${booking.boardroom?.name ?? 'your room'} starts soon.`,
          });
        }
        this.logger.log(`Reminder sent for booking ${booking.id} to ${booking.bookedBy.email}`);
      }
    } catch (err) {
      this.logger.error('Reminder scheduler error', err instanceof Error ? err.stack : String(err));
    }
  }
}
