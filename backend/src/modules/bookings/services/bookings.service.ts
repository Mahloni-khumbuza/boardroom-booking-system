import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { BoardroomBlock } from '../../boardroom-blocks/entities/boardroom-block.entity';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import { Booking, BookingStatus, MeetingType } from '../entities/booking.entity';
import { BookingResponseDto, CalendarEventResponseDto } from '../dto/booking-response.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { MailQueueService } from '../../mail/services/mail-queue.service';
import { SettingsCacheService } from '../../../shared/services/settings-cache.service';
import {
  bookingCreatedHtml,
  bookingConfirmedHtml,
  bookingUpdatedHtml,
  bookingUpdatedAdminHtml,
  bookingCancelledHtml,
  bookingCancelledAdminHtml,
  bookingRejectedHtml,
  bookingReminderHtml,
  approvalRequestHtml,
  facilitiesRequestHtml,
  BookingEmailContext,
} from '../../mail/templates/mail-templates';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookings: Repository<Booking>,
    @InjectRepository(Boardroom)
    private readonly rooms: Repository<Boardroom>,
    @InjectRepository(BoardroomBlock)
    private readonly blocks: Repository<BoardroomBlock>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly notifications: NotificationsService,
    private readonly auditLogs: AuditLogsService,
    private readonly settings: SettingsCacheService,
    private readonly mail: MailQueueService,
    @Inject('automapper:nestjs:default') private readonly mapper: any,
  ) {}

  async create(dto: CreateBookingDto, user: User): Promise<BookingResponseDto> {
    const room = await this.rooms.findOne({ where: { id: dto.boardroomId } });
    if (!room) throw new NotFoundException('Boardroom not found');

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    await this.validateBookingBasics(dto, room, start, end);
    await this.validateOperatingRules(room, start, end);

    const conflictWindow = this.applyBufferWindow(room, start, end);
    await this.validateNoConflicts(room.id, conflictWindow.start, conflictWindow.end);

    const booking = this.bookings.create({
      title: dto.title,
      description: dto.description ?? null,
      boardroom: room,
      boardroomId: room.id,
      bookedByUser: user,
      bookedByUserId: user.id,
      startDateTime: start,
      endDateTime: end,
      attendeeCount: dto.attendeeCount,
      meetingType: dto.meetingType ?? MeetingType.Internal,
      requiresCatering: dto.requiresCatering ?? false,
      cateringNotes: dto.cateringNotes ?? null,
      requiresSetup: dto.requiresSetup ?? false,
      setupNotes: dto.setupNotes ?? null,
      status: room.requiresApproval ? BookingStatus.PENDING_APPROVAL : BookingStatus.APPROVED,
    });

    const saved = await this.bookings.save(booking);

    await this.notifications.notify({
      recipientId: user.id,
      title: 'Booking created',
      message: room.requiresApproval
        ? `Your booking for ${room.name} is pending approval.`
        : `Your booking for ${room.name} has been approved.`,
      type: NotificationType.BookingCreated,
    });
    this.sendBookingEmail(
      user,
      room.requiresApproval ? `Booking submitted: ${saved.title}` : `Booking confirmed: ${saved.title}`,
      room.requiresApproval ? bookingCreatedHtml(this.buildEmailCtx(saved)) : bookingConfirmedHtml(this.buildEmailCtx(saved)),
    );

    if (room.requiresApproval) {
      // Ã‚Â§12: Booking requires approval Ã¢â€ â€™ Admin + FM: approval request with room and time details
      await this.notifyAndEmailOperationalUsers(
        'Booking requires approval',
        `${user.firstName} ${user.lastName} requested ${room.name} on ${saved.startDateTime.toLocaleDateString('en-ZA')}.`,
        NotificationType.BookingApprovalRequired,
        approvalRequestHtml({
          bookerName: `${user.firstName} ${user.lastName}`,
          boardroomName: room.name,
          bookingTitle: saved.title,
          startTime: saved.startDateTime,
          endTime: saved.endDateTime,
          attendeeCount: saved.attendeeCount,
          meetingType: saved.meetingType,
        }),
        `Approval required: ${saved.title}`,
      );
    }

    // Ã‚Â§12: Setup or catering required Ã¢â€ â€™ Facilities Manager only: operational task details
    await this.notifyFacilitiesRequests(saved);
    await this.auditLogs.record({
      action: 'BOOKING_CREATED',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user.id,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  private async validateBookingBasics(
    dto: CreateBookingDto,
    room: Boardroom,
    start: Date,
    end: Date,
  ): Promise<void> {
    if (!dto.title?.trim()) throw new BadRequestException('Booking title is required');
    if (!room.isActive || !room.isBookable) throw new BadRequestException('Boardroom is not bookable');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Start and end date-times are required');
    }
    if (end <= start) throw new BadRequestException('End date-time must be after start date-time');
    if (start < new Date()) throw new BadRequestException('Booking cannot start in the past');
    if (dto.attendeeCount > room.capacity) {
      throw new BadRequestException(`Attendee count exceeds the boardroom capacity of ${room.capacity}.`);
    }

    const minutes = (end.getTime() - start.getTime()) / 60000;
    const minimumMinutes = Math.max(
      room.minimumBookingMinutes,
      await this.settings.getNumber('DEFAULT_MINIMUM_BOOKING_MINUTES', room.minimumBookingMinutes),
    );
    const maximumMinutes = Math.min(
      room.maximumBookingMinutes,
      await this.settings.getNumber('DEFAULT_MAXIMUM_BOOKING_MINUTES', room.maximumBookingMinutes),
    );
    if (minutes < minimumMinutes) {
      throw new BadRequestException(`Minimum meeting duration is ${minimumMinutes} minutes.`);
    }
    if (minutes > maximumMinutes) {
      throw new BadRequestException(`You have exceeded the meeting time limit of ${maximumMinutes} minutes.`);
    }
  }

  private async validateOperatingRules(room: Boardroom, start: Date, end: Date): Promise<void> {
    const allowWeekends = await this.settings.getBoolean('ALLOW_WEEKEND_BOOKINGS', false);
    const allowAfterHours = await this.settings.getBoolean('ALLOW_AFTER_HOURS_BOOKINGS', false);

    const isWeekend = [0, 6].includes(start.getDay()) || [0, 6].includes(end.getDay());
    if (!allowWeekends && isWeekend) throw new BadRequestException("You can't book on a weekend.");

    if (!allowAfterHours) {
      const startTime = start.toTimeString().substring(0, 5);
      const endTime = end.toTimeString().substring(0, 5);
      if (startTime < room.openingTime || endTime > room.closingTime) {
        throw new BadRequestException('Booking is outside boardroom operating hours');
      }
    }
  }

  private applyBufferWindow(room: Boardroom, start: Date, end: Date): { start: Date; end: Date } {
    return {
      start: new Date(start.getTime() - room.bufferTimeBeforeMinutes * 60000),
      end: new Date(end.getTime() + room.bufferTimeAfterMinutes * 60000),
    };
  }

  async validateNoConflicts(
    boardroomId: string,
    start: Date,
    end: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const bookingQb = this.bookings
      .createQueryBuilder('booking')
      .where('booking.boardroomId = :boardroomId', { boardroomId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING_APPROVAL, BookingStatus.APPROVED],
      })
      .andWhere('booking.startDateTime < :end', { end })
      .andWhere('booking.endDateTime > :start', { start });

    if (excludeBookingId) {
      bookingQb.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const conflicts = await bookingQb.getCount();
    if (conflicts > 0) {
      throw new BadRequestException('Booking conflicts with an existing active booking');
    }

    const blockConflicts = await this.blocks
      .createQueryBuilder('block')
      .where('block.boardroomId = :boardroomId', { boardroomId })
      .andWhere('block.isActive = true')
      .andWhere('block.startTime < :end', { end })
      .andWhere('block.endTime > :start', { start })
      .getCount();

    if (blockConflicts > 0) {
      throw new BadRequestException('Booking conflicts with an active room block');
    }
  }

  async myBookings(user: User): Promise<BookingResponseDto[]> {
    const bookings = await this.bookings.find({
      where: { bookedByUserId: user.id },
      relations: { boardroom: true, bookedByUser: true, requestedAmenities: true },
      order: { startDateTime: 'DESC' },
    });
    return this.mapper.mapArray(bookings, Booking, BookingResponseDto);
  }

  async findAll(query: Record<string, string> = {}): Promise<BookingResponseDto[]> {
    return this.mapper.mapArray(await this.findAllEntities(query), Booking, BookingResponseDto);
  }

  private async findAllEntities(query: Record<string, string> = {}): Promise<Booking[]> {
    const qb = this.bookings
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.boardroom', 'boardroom')
      .leftJoinAndSelect('booking.bookedByUser', 'bookedByUser')
      .leftJoinAndSelect('booking.approvedByUser', 'approvedByUser')
      .leftJoinAndSelect('booking.rejectedByUser', 'rejectedByUser')
      .leftJoinAndSelect('booking.requestedAmenities', 'requestedAmenities');

    if (query.status) qb.andWhere('booking.status = :status', { status: query.status });
    if (query.boardroomId) qb.andWhere('booking.boardroomId = :boardroomId', { boardroomId: query.boardroomId });
    if (query.department) {
      qb.andWhere('bookedByUser.department ILIKE :department', { department: `%${query.department}%` });
    }
    if (query.startDateTime) {
      qb.andWhere('booking.endDateTime >= :startDateTime', { startDateTime: query.startDateTime });
    }
    if (query.endDateTime) {
      qb.andWhere('booking.startDateTime <= :endDateTime', { endDateTime: query.endDateTime });
    }

    return qb.orderBy('booking.startDateTime', 'DESC').getMany();
  }

  async calendar(query: Record<string, string> = {}): Promise<CalendarEventResponseDto[]> {
    const bookings = await this.findAllEntities(query);
    const bookingEvents: CalendarEventResponseDto[] = bookings.map((b) => ({
      id: b.id,
      title: b.title,
      start: b.startDateTime,
      end: b.endDateTime,
      status: b.status,
      boardroomId: b.boardroom?.id ?? null,
      boardroom: b.boardroom?.name ?? null,
      owner: `${b.bookedByUser?.firstName ?? ''} ${b.bookedByUser?.lastName ?? ''}`.trim(),
    }));

    const blockQb = this.blocks
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.boardroom', 'boardroom')
      .where('block.isActive = true');

    if (query.boardroomId) {
      blockQb.andWhere('block.boardroomId = :boardroomId', { boardroomId: query.boardroomId });
    }
    if (query.startDateTime) {
      blockQb.andWhere('block.endTime >= :startDateTime', { startDateTime: query.startDateTime });
    }
    if (query.endDateTime) {
      blockQb.andWhere('block.startTime <= :endDateTime', { endDateTime: query.endDateTime });
    }

    const roomBlocks = !query.status || query.status === 'ROOM_BLOCK'
      ? await blockQb.getMany()
      : [];

    const blockEvents: CalendarEventResponseDto[] = roomBlocks.map((block) => ({
      id: block.id,
      title: `Room block: ${block.reason}`,
      start: block.startTime,
      end: block.endTime,
      status: 'ROOM_BLOCK',
      boardroomId: block.boardroom?.id ?? null,
      boardroom: block.boardroom?.name ?? null,
      owner: 'Facilities',
    }));

    return [...bookingEvents, ...blockEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    return this.mapper.map(await this.findOneEntity(id), Booking, BookingResponseDto);
  }

  private async findOneEntity(id: string): Promise<Booking> {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: {
        boardroom: true,
        bookedByUser: true,
        approvedByUser: true,
        rejectedByUser: true,
        requestedAmenities: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto, user: User): Promise<BookingResponseDto> {
    const booking = await this.findOneEntity(id);
    const before = this.safeBooking(booking);

    if (user.role?.name === 'Employee' && booking.bookedByUserId !== user.id) {
      throw new ForbiddenException('You can only update your own bookings');
    }
    if (![BookingStatus.PENDING_APPROVAL, BookingStatus.APPROVED].includes(booking.status)) {
      throw new BadRequestException('Only pending or approved bookings can be updated');
    }

    const room = booking.boardroom;
    if (!room) throw new NotFoundException('Boardroom not found');

    const start = dto.startTime ? new Date(dto.startTime) : booking.startDateTime;
    const end = dto.endTime ? new Date(dto.endTime) : booking.endDateTime;
    const attendeeCount = dto.attendeeCount ?? booking.attendeeCount;

    await this.validateBookingBasics(
      { ...dto, title: dto.title ?? booking.title, boardroomId: room.id, startTime: start.toISOString(), endTime: end.toISOString(), attendeeCount } as CreateBookingDto,
      room,
      start,
      end,
    );
    await this.validateOperatingRules(room, start, end);
    const conflictWindow = this.applyBufferWindow(room, start, end);
    await this.validateNoConflicts(room.id, conflictWindow.start, conflictWindow.end, booking.id);

    if (dto.title !== undefined) booking.title = dto.title;
    if (dto.description !== undefined) booking.description = dto.description ?? null;
    if (dto.attendeeCount !== undefined) booking.attendeeCount = attendeeCount;
    if (dto.meetingType !== undefined) booking.meetingType = dto.meetingType;
    if (dto.requiresCatering !== undefined) booking.requiresCatering = dto.requiresCatering;
    if (dto.cateringNotes !== undefined) booking.cateringNotes = dto.cateringNotes ?? null;
    if (dto.requiresSetup !== undefined) booking.requiresSetup = dto.requiresSetup;
    if (dto.setupNotes !== undefined) booking.setupNotes = dto.setupNotes ?? null;
    booking.startDateTime = start;
    booking.endDateTime = end;
    if (room.requiresApproval) booking.status = BookingStatus.PENDING_APPROVAL;

    const saved = await this.bookings.save(booking);
    // Ã‚Â§12: Booking updated Ã¢â€ â€™ Booker: change summary
    if (saved.bookedByUser) {
      await this.notifications.notify({
        recipientId: saved.bookedByUser.id,
        title: 'Booking updated',
        message: `Your booking "${saved.title}" has been updated.`,
        type: NotificationType.BookingUpdated,
      });
      this.sendBookingEmail(saved.bookedByUser, `Booking updated: ${saved.title}`, bookingUpdatedHtml(this.buildEmailCtx(saved)));
    }
    // Ã‚Â§12: Booking updated Ã¢â€ â€™ relevant admins: change summary
    const changedBy = `${user.firstName} ${user.lastName}`;
    await this.notifyAndEmailOperationalUsers(
      'Booking updated',
      `"${saved.title}" in ${saved.boardroom?.name ?? 'a room'} was updated by ${changedBy}.`,
      NotificationType.BookingUpdated,
      bookingUpdatedAdminHtml({
        recipientName: 'Team',
        boardroomName: saved.boardroom?.name ?? 'Boardroom',
        bookingTitle: saved.title,
        startTime: saved.startDateTime,
        endTime: saved.endDateTime,
        changedBy,
      }),
      `Booking updated: ${saved.title}`,
    );
    // Ã‚Â§12: Setup or catering required Ã¢â€ â€™ FM: operational task details
    await this.notifyFacilitiesRequests(saved);
    await this.auditLogs.record({
      action: 'BOOKING_UPDATED',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user.id,
      before,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  async approve(id: string, user: User): Promise<BookingResponseDto> {
    // Configurable: FacilitiesManager approval can be disabled via FM_CAN_APPROVE_BOOKINGS setting
    if (user.role?.name === 'FacilitiesManager') {
      const allowed = await this.settings.getBoolean('FM_CAN_APPROVE_BOOKINGS', true);
      if (!allowed) {
        throw new ForbiddenException('Facilities Managers are not currently permitted to approve bookings');
      }
    }
    const booking = await this.findOneEntity(id);
    const before = this.safeBooking(booking);
    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending approval bookings can be approved');
    }
    await this.validateNoConflicts(booking.boardroom.id, booking.startDateTime, booking.endDateTime, booking.id);
    booking.status = BookingStatus.APPROVED;
    booking.approvedByUser = user;
    booking.approvedByUserId = user.id;
    booking.approvedAt = new Date();
    await this.bookings.save(booking);
    const saved = await this.findOneEntity(booking.id);
    if (saved.bookedByUser) {
      // Ã‚Â§12: Booking approved Ã¢â€ â€™ Booker: confirmation that booking is approved
      await this.notifications.notify({
        recipientId: saved.bookedByUser.id,
        title: 'Booking approved',
        message: `Your booking "${saved.title}" has been approved and confirmed.`,
        type: NotificationType.BookingApproved,
      });
      this.sendBookingEmail(saved.bookedByUser, `Booking confirmed: ${saved.title}`, bookingConfirmedHtml(this.buildEmailCtx(saved)));
    } else if (saved.bookedByUserId) {
      await this.notifications.notify({
        recipientId: saved.bookedByUserId,
        title: 'Booking approved',
        message: `Your booking "${saved.title}" has been approved and confirmed.`,
        type: NotificationType.BookingApproved,
      });
    }
    await this.auditLogs.record({
      action: 'BOOKING_APPROVED',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user.id,
      before,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  async reject(id: string, user: User, reason: string): Promise<BookingResponseDto> {
    // Configurable: FacilitiesManager rejection can be disabled via FM_CAN_APPROVE_BOOKINGS setting
    if (user.role?.name === 'FacilitiesManager') {
      const allowed = await this.settings.getBoolean('FM_CAN_APPROVE_BOOKINGS', true);
      if (!allowed) {
        throw new ForbiddenException('Facilities Managers are not currently permitted to reject bookings');
      }
    }
    const booking = await this.findOneEntity(id);
    const before = this.safeBooking(booking);
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required');
    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending approval bookings can be rejected');
    }
    booking.status = BookingStatus.REJECTED;
    booking.rejectedByUser = user;
    booking.rejectedByUserId = user.id;
    booking.rejectionReason = reason;
    booking.rejectedAt = new Date();
    await this.bookings.save(booking);
    const saved = await this.findOneEntity(booking.id);
    if (saved.bookedByUser) {
      // Ã‚Â§12: Booking rejected Ã¢â€ â€™ Booker: rejection notice with reason
      await this.notifications.notify({
        recipientId: saved.bookedByUser.id,
        title: 'Booking rejected',
        message: `Your booking "${saved.title}" was rejected. Reason: ${reason}`,
        type: NotificationType.BookingRejected,
      });
      this.sendBookingEmail(saved.bookedByUser, `Booking rejected: ${saved.title}`, bookingRejectedHtml(this.buildEmailCtx(saved)));
    } else if (saved.bookedByUserId) {
      await this.notifications.notify({
        recipientId: saved.bookedByUserId,
        title: 'Booking rejected',
        message: `Your booking "${saved.title}" was rejected. Reason: ${reason}`,
        type: NotificationType.BookingRejected,
      });
    }
    await this.auditLogs.record({
      action: 'BOOKING_REJECTED',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user.id,
      before,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  async cancel(id: string, user: User, reason?: string): Promise<BookingResponseDto> {
    const booking = await this.findOneEntity(id);
    const before = this.safeBooking(booking);
    if (user.role?.name === 'Employee' && booking.bookedByUserId !== user.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if ([BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(booking.status)) {
      throw new BadRequestException('This booking can no longer be cancelled');
    }
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason ?? 'Cancelled';
    booking.cancelledAt = new Date();
    await this.bookings.save(booking);
    const saved = await this.findOneEntity(booking.id);
    const cancelledByName = `${user.firstName} ${user.lastName}`;
    const cancelReason = saved.cancellationReason ?? 'No reason provided';

    // Ã‚Â§12: Booking cancelled Ã¢â€ â€™ Booker: cancellation notice with reason
    if (saved.bookedByUser) {
      await this.notifications.notify({
        recipientId: saved.bookedByUser.id,
        title: 'Booking cancelled',
        message: `Your booking "${saved.title}" was cancelled. ${cancelReason !== 'Cancelled' ? `Reason: ${cancelReason}` : ''}`.trim(),
        type: NotificationType.BookingCancelled,
      });
      this.sendBookingEmail(saved.bookedByUser, `Booking cancelled: ${saved.title}`, bookingCancelledHtml(this.buildEmailCtx(saved)));
    } else if (saved.bookedByUserId) {
      await this.notifications.notify({
        recipientId: saved.bookedByUserId,
        title: 'Booking cancelled',
        message: `Your booking "${saved.title}" was cancelled. ${cancelReason !== 'Cancelled' ? `Reason: ${cancelReason}` : ''}`.trim(),
        type: NotificationType.BookingCancelled,
      });
    }
    // Ã‚Â§12: Booking cancelled Ã¢â€ â€™ relevant admins: cancellation notice with reason
    await this.notifyAndEmailOperationalUsers(
      'Booking cancelled',
      `"${saved.title}" in ${saved.boardroom?.name ?? 'a room'} was cancelled by ${cancelledByName}. Reason: ${cancelReason}`,
      NotificationType.BookingCancelled,
      bookingCancelledAdminHtml({
        ...this.buildEmailCtx(saved),
        userName: 'Team',
        cancelledByName,
      }),
      `Booking cancelled: ${saved.title}`,
    );
    await this.auditLogs.record({
      action: 'BOOKING_CANCELLED',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user.id,
      before,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  async complete(id: string, user?: User): Promise<BookingResponseDto> {
    const booking = await this.findOneEntity(id);
    const before = this.safeBooking(booking);
    if (booking.status !== BookingStatus.APPROVED) {
      throw new BadRequestException('Only approved bookings can be completed');
    }
    booking.status = BookingStatus.COMPLETED;
    const saved = await this.bookings.save(booking);
    await this.auditLogs.record({
      action: 'BOOKING_COMPLETED',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user?.id ?? null,
      before,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  async noShow(id: string, user?: User): Promise<BookingResponseDto> {
    const booking = await this.findOneEntity(id);
    const before = this.safeBooking(booking);
    if (booking.status !== BookingStatus.APPROVED) {
      throw new BadRequestException('Only approved bookings can be marked no-show');
    }
    booking.status = BookingStatus.NO_SHOW;
    const saved = await this.bookings.save(booking);
    await this.auditLogs.record({
      action: 'BOOKING_NO_SHOW',
      entity: 'Booking',
      entityId: saved.id,
      actorId: user?.id ?? null,
      before,
      after: this.safeBooking(saved),
    });
    return this.mapper.map(saved, Booking, BookingResponseDto);
  }

  async remove(id: string, user: User): Promise<void> {
    const booking = await this.findOneEntity(id);
    if (user.role?.name === 'Employee' && booking.bookedByUserId !== user.id) {
      throw new ForbiddenException('You can only delete your own bookings');
    }
    if (booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.REJECTED) {
      throw new BadRequestException('Only cancelled or rejected bookings can be permanently deleted');
    }
    await this.auditLogs.record({
      action: 'BOOKING_DELETED',
      entity: 'Booking',
      entityId: id,
      actorId: user?.id ?? null,
      before: this.safeBooking(booking),
    });
    await this.bookings.delete(id);
  }

  async sendDueReminders(): Promise<{ windowMinutes: number; sent: number; failed: number; skipped: number }> {
    const remindersEnabled = await this.settings.getBoolean('EMAIL_REMINDERS_ENABLED', true);
    const windowMinutes = await this.settings.getNumber('BOOKING_REMINDER_MINUTES_BEFORE', 15);
    if (!remindersEnabled) return { windowMinutes, sent: 0, failed: 0, skipped: 0 };

    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowMinutes * 60000);
    const dueBookings = await this.bookings
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.boardroom', 'boardroom')
      .leftJoinAndSelect('booking.bookedByUser', 'bookedByUser')
      .where('booking.status = :status', { status: BookingStatus.APPROVED })
      .andWhere('booking.startDateTime >= :now', { now })
      .andWhere('booking.startDateTime <= :windowEnd', { windowEnd })
      .orderBy('booking.startDateTime', 'ASC')
      .getMany();

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const booking of dueBookings) {
      if (!booking.bookedByUser) { skipped += 1; continue; }
      try {
        await this.notifications.notify({
          recipientId: booking.bookedByUser.id,
          title: 'Booking reminder',
          message: `Reminder: your booking "${booking.title}" starts in ${windowMinutes} minute(s) or less.`,
          type: NotificationType.BookingReminder,
        });
        this.sendBookingEmail(
          booking.bookedByUser,
          `Reminder: ${booking.title} starts soon`,
          bookingReminderHtml({
            userName: `${booking.bookedByUser.firstName} ${booking.bookedByUser.lastName}`.trim(),
            boardroomName: booking.boardroom?.name ?? 'Boardroom',
            bookingTitle: booking.title,
            startTime: booking.startDateTime,
            endTime: booking.endDateTime,
            reminderMinutes: windowMinutes,
          }),
        );
        sent += 1;
      } catch (err) {
        this.logger.warn(
          `Failed to process reminder for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        failed += 1;
      }
    }

    return { windowMinutes, sent, failed, skipped };
  }

  private sendBookingEmail(recipient: User, subject: string, html: string): void {
    if (!recipient?.email) return;
    void this.mail.enqueue({ to: recipient.email, subject, html });
  }

  private buildEmailCtx(booking: Booking): BookingEmailContext {
    return {
      userName: `${booking.bookedByUser?.firstName ?? ''} ${booking.bookedByUser?.lastName ?? ''}`.trim(),
      boardroomName: booking.boardroom?.name ?? 'Boardroom',
      bookingTitle: booking.title,
      startTime: booking.startDateTime,
      endTime: booking.endDateTime,
      status: booking.status,
      cancellationReason: booking.cancellationReason ?? undefined,
      rejectionReason: booking.rejectionReason ?? undefined,
    };
  }

  // Ã‚Â§12: Generic: in-app + email to Admin, SuperAdmin, FacilitiesManager
  private async notifyAndEmailOperationalUsers(
    title: string,
    message: string,
    type: NotificationType,
    emailHtml: string,
    emailSubject: string,
  ): Promise<void> {
    const operationalUsers = await this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name IN (:...roles)', { roles: ['Admin', 'SuperAdmin', 'FacilitiesManager'] })
      .andWhere('user.isActive = true')
      .getMany();

    for (const user of operationalUsers) {
      await this.notifications.notify({ recipientId: user.id, title, message, type });
      this.sendBookingEmail(user, emailSubject, emailHtml);
    }
  }

  // Ã‚Â§12: Setup or catering required Ã¢â€ â€™ Facilities Manager only (not Admin/SuperAdmin)
  private async notifyFacilitiesRequests(booking: Booking): Promise<void> {
    if (!booking.requiresCatering && !booking.requiresSetup) return;

    const facilitiesUsers = await this.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :role', { role: 'FacilitiesManager' })
      .andWhere('user.isActive = true')
      .getMany();

    if (facilitiesUsers.length === 0) return;

    const taskParts: string[] = [];
    if (booking.requiresCatering) taskParts.push(`catering${booking.cateringNotes ? ` (${booking.cateringNotes})` : ''}`);
    if (booking.requiresSetup) taskParts.push(`room setup${booking.setupNotes ? ` (${booking.setupNotes})` : ''}`);
    const taskSummary = taskParts.join(' and ');

    const emailHtml = facilitiesRequestHtml({
      boardroomName: booking.boardroom?.name ?? 'Boardroom',
      bookingTitle: booking.title,
      startTime: booking.startDateTime,
      endTime: booking.endDateTime,
      bookerName: booking.bookedByUser
        ? `${booking.bookedByUser.firstName} ${booking.bookedByUser.lastName}`
        : 'Unknown',
      requiresCatering: booking.requiresCatering,
      cateringNotes: booking.cateringNotes,
      requiresSetup: booking.requiresSetup,
      setupNotes: booking.setupNotes,
    });

    for (const user of facilitiesUsers) {
      await this.notifications.notify({
        recipientId: user.id,
        title: 'Facilities request',
        message: `"${booking.title}" in ${booking.boardroom?.name ?? 'a room'} requires ${taskSummary}.`,
        type: NotificationType.FacilitiesRequest,
      });
      this.sendBookingEmail(user, `Facilities request: ${booking.title}`, emailHtml);
    }
  }

  private safeBooking(booking: Booking): Record<string, unknown> {
    return {
      id: booking.id,
      title: booking.title,
      status: booking.status,
      boardroomId: booking.boardroomId,
      bookedByUserId: booking.bookedByUserId,
      startDateTime: booking.startDateTime,
      endDateTime: booking.endDateTime,
      attendeeCount: booking.attendeeCount,
    };
  }
}
