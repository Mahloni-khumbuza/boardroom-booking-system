import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Amenity } from '../../amenities/entities/amenity.entity';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { BoardroomBlocksService } from '../../boardroom-blocks/services/boardroom-blocks.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SystemSettingsService } from '../../system-settings/services/system-settings.service';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { BookingQueryDto } from '../dto/booking-query.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';

const ADMIN_ROLES = new Set(['SuperAdmin', 'Admin', 'FacilitiesManager']);
const ACTIVE_STATUSES = [BookingStatus.Pending, BookingStatus.Confirmed];

interface BookingRules {
  operatingHoursStart: string;
  operatingHoursEnd: string;
  bufferMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
}

const DEFAULT_RULES: BookingRules = {
  operatingHoursStart: '08:00',
  operatingHoursEnd: '18:00',
  bufferMinutes: 15,
  minDurationMinutes: 15,
  maxDurationMinutes: 480,
};

export interface ActorContext {
  id: string;
  role: string | null;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    @InjectRepository(Boardroom)
    private readonly boardroomsRepo: Repository<Boardroom>,
    @InjectRepository(Amenity)
    private readonly amenitiesRepo: Repository<Amenity>,
    private readonly dataSource: DataSource,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BoardroomBlocksService,
    private readonly settings: SystemSettingsService,
  ) {}

  async findAll(query: BookingQueryDto, actor: ActorContext): Promise<Booking[]> {
    try {
      const where: Record<string, unknown> = {};
      if (query.status) where['status'] = query.status;
      if (query.boardroomId) where['boardroomId'] = query.boardroomId;
      if (query.bookedById) where['bookedById'] = query.bookedById;
      if (query.mine) where['bookedById'] = actor.id;
      if (!this.isAdmin(actor) && !query.mine && !query.bookedById) {
        where['bookedById'] = actor.id;
      }
      if (query.from && query.to) {
        where['startTime'] = Between(new Date(query.from), new Date(query.to));
      } else if (query.from) {
        where['endTime'] = MoreThanOrEqual(new Date(query.from));
      } else if (query.to) {
        where['startTime'] = LessThanOrEqual(new Date(query.to));
      }
      return await this.repo.find({
        where,
        relations: { boardroom: true, bookedBy: true, requestedAmenities: true },
        order: { startTime: 'ASC' },
        take: 500,
      });
    } catch (err) {
      this.rethrow(err, 'findAll bookings');
    }
  }

  async findOne(id: string, actor: ActorContext): Promise<Booking> {
    try {
      const booking = await this.repo.findOne({
        where: { id },
        relations: { boardroom: true, bookedBy: true, requestedAmenities: true },
      });
      if (!booking) throw new NotFoundException(`Booking ${id} not found`);
      if (!this.isAdmin(actor) && booking.bookedById !== actor.id) {
        throw new ForbiddenException('You can only view your own bookings');
      }
      return booking;
    } catch (err) {
      this.rethrow(err, 'findOne booking');
    }
  }

  async create(dto: CreateBookingDto, actor: ActorContext): Promise<Booking> {
    // 1. Validate times
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }
    if (end <= start) throw new BadRequestException('endTime must be after startTime');
    if (start <= new Date()) throw new BadRequestException('Booking start time must be in the future');

    // 2. Validate boardroom
    const boardroom = await this.boardroomsRepo.findOne({ where: { id: dto.boardroomId } });
    if (!boardroom) throw new BadRequestException(`Boardroom ${dto.boardroomId} not found`);
    if (!boardroom.isActive) throw new BadRequestException(`Boardroom "${boardroom.name}" is not active`);
    if (!boardroom.isBookable) throw new BadRequestException(`Boardroom "${boardroom.name}" is not bookable`);
    if (dto.attendeeCount > boardroom.capacity) {
      throw new BadRequestException(
        `Attendee count (${dto.attendeeCount}) exceeds boardroom capacity (${boardroom.capacity})`,
      );
    }

    // 3. Validate duration, hours and conflicts
    const rules = await this.loadRules();
    this.assertDuration(start, end, rules);
    this.assertWithinOperatingHours(start, end, rules);
    await this.assertNoConflict(boardroom.id, start, end, undefined, rules.bufferMinutes);

    const requestedAmenities = await this.resolveRequestedAmenities(dto.requestedAmenityIds, boardroom.id);
    // All bookings start as Pending and must go through the approval workflow.
    // Only auto-confirm if the boardroom does not require approval AND the actor is an Admin/SuperAdmin.
    const initialStatus =
      !boardroom.requiresApproval && this.isAdmin(actor)
        ? BookingStatus.Confirmed
        : BookingStatus.Pending;

    // 4. Persist in transaction
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let saved: Booking;
    try {
      const booking = this.repo.create({
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startTime: start,
        endTime: end,
        attendeeCount: dto.attendeeCount,
        status: initialStatus,
        meetingType: dto.meetingType,
        requiresCatering: dto.requiresCatering ?? false,
        cateringNotes: dto.cateringNotes?.trim() || null,
        requiresSetup: dto.requiresSetup ?? false,
        setupNotes: dto.setupNotes?.trim() || null,
        boardroomId: boardroom.id,
        bookedById: actor.id,
        requestedAmenities,
      });
      saved = await qr.manager.save(Booking, booking);
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      this.rethrow(err, 'create booking');
    } finally {
      await qr.release();
    }

    // 5. Audit log
    await this.auditLogs.record({
      action: 'booking.created',
      entity: 'booking',
      entityId: saved!.id,
      actorId: actor.id,
      metadata: {
        title: saved!.title,
        status: saved!.status,
        boardroomId: boardroom.id,
        attendeeCount: saved!.attendeeCount,
      },
    });

    // 6. Notification
    await this.notifications.notify({
      recipientId: actor.id,
      type: NotificationType.BookingCreated,
      title: initialStatus === BookingStatus.Pending ? 'Booking submitted' : 'Booking confirmed',
      message:
        initialStatus === BookingStatus.Pending
          ? `Your booking for "${boardroom.name}" is awaiting approval.`
          : `Your booking for "${boardroom.name}" is confirmed.`,
    });

    // 7. Return mapped DTO
    return this.reload(saved!.id);
  }

  async update(id: string, dto: UpdateBookingDto, actor: ActorContext): Promise<Booking> {
    try {
      const booking = await this.findOne(id, actor);
      if (booking.status === BookingStatus.Cancelled) {
        throw new BadRequestException('Cannot edit a cancelled booking');
      }

      const start = dto.startTime ? new Date(dto.startTime) : booking.startTime;
      const end = dto.endTime ? new Date(dto.endTime) : booking.endTime;
      if (end <= start) throw new BadRequestException('endTime must be after startTime');

      if (dto.attendeeCount !== undefined) {
        if (dto.attendeeCount > booking.boardroom.capacity) {
          throw new BadRequestException(
            `Attendee count (${dto.attendeeCount}) exceeds boardroom capacity (${booking.boardroom.capacity})`,
          );
        }
        booking.attendeeCount = dto.attendeeCount;
      }

      const rules = await this.loadRules();
      if (dto.startTime || dto.endTime) {
        this.assertDuration(start, end, rules);
        this.assertWithinOperatingHours(start, end, rules);
        await this.assertNoConflict(booking.boardroomId, start, end, booking.id, rules.bufferMinutes);
      }

      if (dto.requestedAmenityIds !== undefined) {
        booking.requestedAmenities = await this.resolveRequestedAmenities(
          dto.requestedAmenityIds,
          booking.boardroomId,
        );
      }

      if (dto.title !== undefined) booking.title = dto.title.trim();
      if (dto.description !== undefined) booking.description = dto.description?.trim() || null;
      booking.startTime = start;
      booking.endTime = end;

      const saved = await this.repo.save(booking);
      await this.auditLogs.record({
        action: 'booking.updated',
        entity: 'booking',
        entityId: saved.id,
        actorId: actor.id,
      });
      return this.reload(saved.id);
    } catch (err) {
      this.rethrow(err, 'update booking');
    }
  }

  async approve(id: string, actor: ActorContext): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true, requestedAmenities: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (booking.status !== BookingStatus.Pending) {
      throw new BadRequestException(`Booking is not pending (status: ${booking.status})`);
    }

    // Persist in transaction
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let saved: Booking;
    try {
      booking.status = BookingStatus.Confirmed;
      booking.approvedById = actor.id;
      saved = await qr.manager.save(Booking, booking);
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      this.rethrow(err, 'approve booking');
    } finally {
      await qr.release();
    }

    await this.auditLogs.record({
      action: 'booking.approved',
      entity: 'booking',
      entityId: saved!.id,
      actorId: actor.id,
    });

    if (booking.bookedById) {
      await this.notifications.notify({
        recipientId: booking.bookedById,
        type: NotificationType.BookingCreated,
        title: 'Booking approved',
        message: `Your booking "${saved!.title}" has been approved.`,
      });
    }

    return this.reload(saved!.id);
  }

  async complete(id: string, actor: ActorContext): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true, requestedAmenities: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (!this.isAdmin(actor)) throw new ForbiddenException('Only admins can mark bookings as completed');
    if (booking.status !== BookingStatus.Confirmed) {
      throw new BadRequestException(`Only confirmed bookings can be completed (status: ${booking.status})`);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let saved: Booking;
    try {
      booking.status = BookingStatus.Completed;
      saved = await qr.manager.save(Booking, booking);
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      this.rethrow(err, 'complete booking');
    } finally {
      await qr.release();
    }

    await this.auditLogs.record({
      action: 'booking.completed',
      entity: 'booking',
      entityId: saved!.id,
      actorId: actor.id,
    });

    return this.reload(saved!.id);
  }

  async cancel(id: string, actor: ActorContext): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true, requestedAmenities: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (!this.isAdmin(actor) && booking.bookedById !== actor.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (booking.status === BookingStatus.Cancelled) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // Persist in transaction
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let saved: Booking;
    try {
      booking.status = BookingStatus.Cancelled;
      booking.rejectedById = actor.id;
      saved = await qr.manager.save(Booking, booking);
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      this.rethrow(err, 'cancel booking');
    } finally {
      await qr.release();
    }

    await this.auditLogs.record({
      action: 'booking.cancelled',
      entity: 'booking',
      entityId: saved!.id,
      actorId: actor.id,
    });

    if (booking.bookedById && booking.bookedById !== actor.id) {
      await this.notifications.notify({
        recipientId: booking.bookedById,
        type: NotificationType.BookingCancelled,
        title: 'Booking cancelled',
        message: `Your booking "${saved!.title}" was cancelled by an administrator.`,
      });
    }

    return this.reload(saved!.id);
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    try {
      const booking = await this.repo.findOne({ where: { id } });
      if (!booking) throw new NotFoundException(`Booking ${id} not found`);
      await this.repo.delete(id);
      await this.auditLogs.record({
        action: 'booking.deleted',
        entity: 'booking',
        entityId: id,
        actorId: actor.id,
        metadata: { title: booking.title },
      });
    } catch (err) {
      this.rethrow(err, 'delete booking');
    }
  }

  private async loadRules(): Promise<BookingRules> {
    const [start, end, buffer, minDur, maxDur] = await Promise.all([
      this.settings.findByKey('booking.operating_hours_start'),
      this.settings.findByKey('booking.operating_hours_end'),
      this.settings.findByKey('booking.buffer_minutes'),
      this.settings.findByKey('booking.min_duration_minutes'),
      this.settings.findByKey('booking.max_duration_minutes'),
    ]);
    return {
      operatingHoursStart: start?.value ?? DEFAULT_RULES.operatingHoursStart,
      operatingHoursEnd: end?.value ?? DEFAULT_RULES.operatingHoursEnd,
      bufferMinutes: Number(buffer?.value ?? DEFAULT_RULES.bufferMinutes),
      minDurationMinutes: Number(minDur?.value ?? DEFAULT_RULES.minDurationMinutes),
      maxDurationMinutes: Number(maxDur?.value ?? DEFAULT_RULES.maxDurationMinutes),
    };
  }

  private assertDuration(start: Date, end: Date, rules: BookingRules): void {
    const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
    if (durationMinutes < rules.minDurationMinutes) {
      throw new BadRequestException(
        `Booking duration must be at least ${rules.minDurationMinutes} minutes`,
      );
    }
    if (durationMinutes > rules.maxDurationMinutes) {
      throw new BadRequestException(
        `Booking duration cannot exceed ${rules.maxDurationMinutes} minutes (${rules.maxDurationMinutes / 60} hours)`,
      );
    }
  }

  private assertWithinOperatingHours(start: Date, end: Date, rules: BookingRules): void {
    const [startH, startM] = rules.operatingHoursStart.split(':').map(Number);
    const [endH, endM] = rules.operatingHoursEnd.split(':').map(Number);
    const bookingStartMinutes = start.getHours() * 60 + start.getMinutes();
    const bookingEndMinutes = end.getHours() * 60 + end.getMinutes();
    const opStart = startH * 60 + startM;
    const opEnd = endH * 60 + endM;
    if (bookingStartMinutes < opStart || bookingEndMinutes > opEnd) {
      throw new BadRequestException(
        `Bookings must be between ${rules.operatingHoursStart} and ${rules.operatingHoursEnd}`,
      );
    }
  }

  private async resolveRequestedAmenities(
    requestedIds: string[] | undefined,
    boardroomId: string,
  ): Promise<Amenity[]> {
    if (!requestedIds || requestedIds.length === 0) return [];
    const roomWithAmenities = await this.boardroomsRepo.findOne({ where: { id: boardroomId } });
    const roomAmenityIds = new Set((roomWithAmenities?.amenities ?? []).map((a) => a.id));
    const notInRoom = requestedIds.filter((rid) => !roomAmenityIds.has(rid));
    if (notInRoom.length > 0) {
      throw new BadRequestException(
        `Requested amenities not available in this boardroom: ${notInRoom.join(', ')}`,
      );
    }
    return this.amenitiesRepo.find({ where: { id: In(requestedIds) } });
  }

  private async assertNoConflict(
    boardroomId: string,
    start: Date,
    end: Date,
    excludeId: string | undefined,
    bufferMinutes: number,
  ): Promise<void> {
    const block = await this.blocks.findOverlapping(boardroomId, start, end);
    if (block) {
      throw new ConflictException(
        `Boardroom is blocked (${block.reason}) from ${block.startTime.toISOString()} to ${block.endTime.toISOString()}`,
      );
    }
    const bufferMs = bufferMinutes * 60 * 1000;
    const expandedStart = new Date(start.getTime() - bufferMs);
    const expandedEnd = new Date(end.getTime() + bufferMs);
    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.boardroomId = :boardroomId', { boardroomId })
      .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start: expandedStart, end: expandedEnd });
    if (excludeId) qb.andWhere('b.id != :excludeId', { excludeId });
    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        `Booking conflicts (with ${bufferMinutes}-min buffer) with existing booking "${conflict.title}" from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
      );
    }
  }

  private async reload(id: string): Promise<Booking> {
    const fresh = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true, approvedBy: true, requestedAmenities: true },
    });
    if (!fresh) throw new NotFoundException(`Booking ${id} disappeared after save`);
    return fresh;
  }

  private isAdmin(actor: ActorContext): boolean {
    return actor.role !== null && ADMIN_ROLES.has(actor.role);
  }

  private rethrow(err: unknown, context: string): never {
    if (
      err instanceof BadRequestException ||
      err instanceof NotFoundException ||
      err instanceof ForbiddenException ||
      err instanceof ConflictException
    ) {
      throw err;
    }
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
