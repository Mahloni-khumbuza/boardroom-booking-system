import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import {
  DashboardStatsDto,
  EmployeeDashboardStatsDto,
  UpcomingBookingDto,
} from '../dto/dashboard-stats.dto';
import {
  BookingsByDepartmentDto,
  CancellationReportDto,
  PeakHourDto,
  ReportingQueryDto,
  RoomUsageRankDto,
  RoomUtilisationDto,
} from '../dto/reporting.dto';

const OPERATING_HOURS_PER_DAY = 10; // 08:00–18:00

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
          .where('b.startTime >= :start AND b.startTime < :end', { start: startOfToday, end: endOfToday })
          .getCount(),
        this.bookingsRepo
          .createQueryBuilder('b')
          .where('b.startTime >= :start AND b.startTime < :end', { start: startOfToday, end: weekFromNow })
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
    } catch (err) { return this.rethrow(err, 'getAdminStats'); }
  }

  async getEmployeeStats(userId: string): Promise<EmployeeDashboardStatsDto> {
    try {
      const now = new Date();
      const [myUpcoming, myPending, activeBoardrooms, upcoming, unread] = await Promise.all([
        this.bookingsRepo.count({
          where: { bookedById: userId, status: BookingStatus.Confirmed, startTime: MoreThanOrEqual(now) },
        }),
        this.bookingsRepo.count({ where: { bookedById: userId, status: BookingStatus.Pending } }),
        this.boardroomsRepo.count({ where: { isActive: true } }),
        this.bookingsRepo.find({
          where: { bookedById: userId, startTime: MoreThanOrEqual(now) },
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
    } catch (err) { return this.rethrow(err, 'getEmployeeStats'); }
  }

  private rethrow(err: unknown, context: string): never {
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  async getRoomUtilisation(query: ReportingQueryDto = {}): Promise<RoomUtilisationDto[]> {
    try {
      const { from, to } = this.resolveWindow(query);
      const boardrooms = await this.boardroomsRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });

      const rows: RoomUtilisationDto[] = [];
      const dayCount = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (86400 * 1000)));
      const availableMinutes = dayCount * OPERATING_HOURS_PER_DAY * 60;

      for (const room of boardrooms) {
        const bookings = await this.bookingsRepo.find({
          where: {
            boardroomId: room.id,
            status: BookingStatus.Confirmed,
            startTime: Between(from, to),
          },
        });
        const booked = bookings.reduce((sum, b) => {
          return sum + (b.endTime.getTime() - b.startTime.getTime()) / 60_000;
        }, 0);
        rows.push({
          boardroomId: room.id,
          boardroomName: room.name,
          totalBookings: bookings.length,
          totalBookedMinutes: Math.round(booked),
          utilisationPct: availableMinutes > 0 ? Math.round((booked / availableMinutes) * 100) : 0,
        });
      }
      return rows;
    } catch (err) {
      this.logger.error('Unexpected error in getRoomUtilisation', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getBookingsByDepartment(query: ReportingQueryDto = {}): Promise<BookingsByDepartmentDto[]> {
    try {
      const { from, to } = this.resolveWindow(query);
      const result = await this.bookingsRepo
        .createQueryBuilder('b')
        .leftJoin('b.bookedBy', 'u')
        .select('COALESCE(u.department, \'Unknown\')', 'department')
        .addSelect('COUNT(b.id)', 'bookingCount')
        .where('b.startTime BETWEEN :from AND :to', { from, to })
        .groupBy('COALESCE(u.department, \'Unknown\')')
        .orderBy('"bookingCount"', 'DESC')
        .getRawMany<{ department: string; bookingCount: string }>();

      return result.map((r) => ({ department: r.department, bookingCount: Number(r.bookingCount) }));
    } catch (err) {
      this.logger.error('Unexpected error in getBookingsByDepartment', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getPeakHours(query: ReportingQueryDto = {}): Promise<PeakHourDto[]> {
    try {
      const { from, to } = this.resolveWindow(query);
      const result = await this.bookingsRepo
        .createQueryBuilder('b')
        .select('EXTRACT(HOUR FROM b.start_time)', 'hour')
        .addSelect('COUNT(b.id)', 'bookingCount')
        .where('b.startTime BETWEEN :from AND :to', { from, to })
        .groupBy('EXTRACT(HOUR FROM b.start_time)')
        .orderBy('EXTRACT(HOUR FROM b.start_time)', 'ASC')
        .getRawMany<{ hour: string; bookingCount: string }>();

      return result.map((r) => ({ hour: Number(r.hour), bookingCount: Number(r.bookingCount) }));
    } catch (err) {
      this.logger.error('Unexpected error in getPeakHours', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getMostUsedRooms(query: ReportingQueryDto = {}): Promise<RoomUsageRankDto[]> {
    return this.getRoomRanking(query, 'DESC');
  }

  async getLeastUsedRooms(query: ReportingQueryDto = {}): Promise<RoomUsageRankDto[]> {
    return this.getRoomRanking(query, 'ASC');
  }

  async getCancellationReport(query: ReportingQueryDto = {}): Promise<CancellationReportDto> {
    try {
      const { from, to } = this.resolveWindow(query);
      const [totalBookings, totalCancelled, noShowEstimate] = await Promise.all([
        this.bookingsRepo
          .createQueryBuilder('b')
          .where('b.startTime BETWEEN :from AND :to', { from, to })
          .getCount(),
        this.bookingsRepo
          .createQueryBuilder('b')
          .where('b.startTime BETWEEN :from AND :to', { from, to })
          .andWhere('b.status = :status', { status: BookingStatus.Cancelled })
          .getCount(),
        // confirmed bookings whose endTime has passed but never marked completed
        this.bookingsRepo
          .createQueryBuilder('b')
          .where('b.startTime BETWEEN :from AND :to', { from, to })
          .andWhere('b.status = :status', { status: BookingStatus.Confirmed })
          .andWhere('b.endTime < :now', { now: new Date() })
          .getCount(),
      ]);

      return {
        totalCancelled,
        totalBookings,
        cancellationRatePct: totalBookings > 0 ? Math.round((totalCancelled / totalBookings) * 100) : 0,
        noShowEstimate,
      };
    } catch (err) {
      this.logger.error('Unexpected error in getCancellationReport', err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  private async getRoomRanking(query: ReportingQueryDto, order: 'ASC' | 'DESC'): Promise<RoomUsageRankDto[]> {
    try {
      const { from, to } = this.resolveWindow(query);
      const result = await this.bookingsRepo
        .createQueryBuilder('b')
        .leftJoin('b.boardroom', 'room')
        .select('b.boardroomId', 'boardroomId')
        .addSelect('room.name', 'boardroomName')
        .addSelect('COUNT(b.id)', 'bookingCount')
        .where('b.startTime BETWEEN :from AND :to', { from, to })
        .groupBy('b.boardroomId, room.name')
        .orderBy('"bookingCount"', order)
        .limit(10)
        .getRawMany<{ boardroomId: string; boardroomName: string; bookingCount: string }>();

      return result.map((r) => ({
        boardroomId: r.boardroomId,
        boardroomName: r.boardroomName,
        bookingCount: Number(r.bookingCount),
      }));
    } catch (err) {
      this.logger.error(`Unexpected error in getRoomRanking(${order})`, err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  private resolveWindow(query: ReportingQueryDto): { from: Date; to: Date } {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = query.from ? new Date(query.from) : defaultFrom;
    const to = query.to ? new Date(query.to) : now;
    return { from, to };
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
