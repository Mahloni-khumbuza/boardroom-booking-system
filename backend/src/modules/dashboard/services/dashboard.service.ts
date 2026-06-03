import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import {
  DashboardStatsDto,
  EmployeeDashboardStatsDto,
  UpcomingBookingDto,
} from '../dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Boardroom)
    private readonly boardroomsRepo: Repository<Boardroom>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async getAdminStats(): Promise<DashboardStatsDto> {
    try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const weekFromNow = new Date(startOfToday);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      totalUsers,
      totalBoardrooms,
      activeBoardrooms,
      totalBookings,
      pending,
      confirmed,
      cancelled,
      completed,
      bookingsToday,
      bookingsThisWeek,
      upcoming,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.boardroomsRepo.count(),
      this.boardroomsRepo.count({ where: { isActive: true } }),
      this.bookingsRepo.count(),
      this.bookingsRepo.count({ where: { status: BookingStatus.Pending } }),
      this.bookingsRepo.count({ where: { status: BookingStatus.Confirmed } }),
      this.bookingsRepo.count({ where: { status: BookingStatus.Cancelled } }),
      this.bookingsRepo.count({ where: { status: BookingStatus.Completed } }),
      this.bookingsRepo
        .createQueryBuilder('b')
        .where('b.startTime >= :start AND b.startTime < :end', {
          start: startOfToday,
          end: endOfToday,
        })
        .getCount(),
      this.bookingsRepo
        .createQueryBuilder('b')
        .where('b.startTime >= :start AND b.startTime < :end', {
          start: startOfToday,
          end: weekFromNow,
        })
        .getCount(),
      this.bookingsRepo.find({
        where: { startTime: MoreThanOrEqual(now), status: BookingStatus.Confirmed },
        relations: { boardroom: true },
        order: { startTime: 'ASC' },
        take: 5,
      }),
    ]);

    return {
      totalUsers,
      totalBoardrooms,
      activeBoardrooms,
      totalBookings,
      bookingsByStatus: { pending, confirmed, cancelled, completed },
      bookingsToday,
      bookingsThisWeek,
      upcomingBookings: upcoming.map((b) => this.toUpcoming(b)),
    };
    } catch (err) {
      this.logger.error('Unexpected error in getAdminStats', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getEmployeeStats(userId: string): Promise<EmployeeDashboardStatsDto> {
    try {
    const now = new Date();
    const [myUpcoming, myPending, activeBoardrooms, upcoming, unread] = await Promise.all([
      this.bookingsRepo.count({
        where: {
          bookedById: userId,
          status: BookingStatus.Confirmed,
          startTime: MoreThanOrEqual(now),
        },
      }),
      this.bookingsRepo.count({
        where: { bookedById: userId, status: BookingStatus.Pending },
      }),
      this.boardroomsRepo.count({ where: { isActive: true } }),
      this.bookingsRepo.find({
        where: {
          bookedById: userId,
          startTime: MoreThanOrEqual(now),
        },
        relations: { boardroom: true },
        order: { startTime: 'ASC' },
        take: 5,
      }),
      this.notificationsRepo.count({ where: { recipientId: userId, isRead: false } }),
    ]);

    return {
      myUpcomingBookings: myUpcoming,
      myPendingBookings: myPending,
      activeBoardrooms,
      upcomingBookings: upcoming.map((b) => this.toUpcoming(b)),
      unreadNotifications: unread,
    };
    } catch (err) {
      this.logger.error('Unexpected error in getEmployeeStats', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  private toUpcoming(b: Booking): UpcomingBookingDto {
    return {
      id: b.id,
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      boardroomName: b.boardroom?.name ?? 'Unknown',
      status: b.status,
    };
  }
}
