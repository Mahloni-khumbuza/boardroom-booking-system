import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MailQueueService } from '../../mail/services/mail-queue.service';
import { bookingReminderHtml } from '../../mail/templates/mail-templates';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SettingsCacheService } from '../../../shared/services/settings-cache.service';
import { Booking, BookingStatus } from '../entities/booking.entity';

const DEFAULT_REMINDER_MINUTES = 30;

@Injectable()
export class BookingReminderScheduler {
  private readonly logger = new Logger(BookingReminderScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly settings: SettingsCacheService,
    private readonly mail: MailQueueService,
    private readonly notifications: NotificationsService,
  ) {}

  // Runs every minute; reminder window and enabled state are controlled via system settings:
  //   EMAIL_REMINDERS_ENABLED  (boolean, default true)
  //   BOOKING_REMINDER_MINUTES_BEFORE  (number, default 30)
  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders(): Promise<void> {
    try {
      const enabled = await this.settings.getBoolean('EMAIL_REMINDERS_ENABLED', true);
      if (!enabled) return;

      const reminderMinutes = await this.settings.getNumber('BOOKING_REMINDER_MINUTES_BEFORE', DEFAULT_REMINDER_MINUTES);
      if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) return;

      const now = new Date();
      const windowStart = new Date(now.getTime() + reminderMinutes * 60_000 - 30_000);
      const windowEnd = new Date(now.getTime() + reminderMinutes * 60_000 + 30_000);

      const upcoming = await this.repo.find({
        where: {
          status: BookingStatus.APPROVED,
          startDateTime: Between(windowStart, windowEnd),
        },
        relations: { bookedByUser: true, boardroom: true },
      });

      let sent = 0;
      let failed = 0;

      for (const booking of upcoming) {
        if (!booking.bookedByUser?.email) continue;

        try {
          await this.mail.enqueue({
            to: booking.bookedByUser.email,
            subject: `Reminder: "${booking.title}" starts in ${reminderMinutes} minutes`,
            html: bookingReminderHtml({
              userName: `${booking.bookedByUser.firstName} ${booking.bookedByUser.lastName}`,
              boardroomName: booking.boardroom?.name ?? 'Unknown',
              bookingTitle: booking.title,
              startTime: booking.startDateTime,
              endTime: booking.endDateTime,
              reminderMinutes,
            }),
          });

          if (booking.bookedByUserId) {
            await this.notifications.notify({
              recipientId: booking.bookedByUserId,
              type: NotificationType.BookingReminder,
              title: `Reminder: booking in ${reminderMinutes} min`,
              message: `"${booking.title}" in ${booking.boardroom?.name ?? 'your room'} starts soon.`,
            });
          }

          sent += 1;
        } catch (err) {
          this.logger.warn(`Failed reminder for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
          failed += 1;
        }
      }

      if (sent || failed) {
        this.logger.log(`Reminders: sent=${sent}, failed=${failed}, window=${reminderMinutes}min`);
      }
    } catch (err) {
      this.logger.error('Reminder scheduler error', err instanceof Error ? err.stack : String(err));
    }
  }
}
