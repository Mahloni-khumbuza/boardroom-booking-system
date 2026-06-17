import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Amenity } from '../../amenities/entities/amenity.entity';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { BoardroomBlock } from '../../boardroom-blocks/entities/boardroom-block.entity';
import { Boardroom } from '../entities/boardroom.entity';
import { BoardroomQueryDto } from '../dto/boardroom-query.dto';
import { BoardroomResponseDto } from '../dto/boardroom-response.dto';
import { CreateBoardroomDto } from '../dto/create-boardroom.dto';
import { UpdateBoardroomDto } from '../dto/update-boardroom.dto';
import { AvailabilityQueryDto, AvailabilityResponseDto, TimeSlot } from '../dto/availability-query.dto';

@Injectable()
export class BoardroomsService {
  private readonly logger = new Logger(BoardroomsService.name);

  constructor(
    @InjectRepository(Boardroom)
    private readonly repo: Repository<Boardroom>,
    @InjectRepository(Amenity)
    private readonly amenitiesRepo: Repository<Amenity>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(BoardroomBlock)
    private readonly blocksRepo: Repository<BoardroomBlock>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(query: BoardroomQueryDto = {}): Promise<BoardroomResponseDto[]> {
    try {
      const qb = this.repo
        .createQueryBuilder('room')
        .leftJoinAndSelect('room.amenities', 'amenity')
        .orderBy('room.name', 'ASC');

      if (query.activeOnly === true) qb.andWhere('room.isActive = true');
      if (query.minCapacity !== undefined) {
        qb.andWhere('room.capacity >= :minCapacity', { minCapacity: query.minCapacity });
      }
      if (query.location) {
        qb.andWhere('room.location ILIKE :location', { location: `%${query.location}%` });
      }
      if (query.amenityIds?.length) {
        qb.andWhere((sub) => {
          const sq = sub
            .subQuery()
            .select('ba.boardroom_id')
            .from('boardroom_amenities', 'ba')
            .where('ba.amenity_id IN (:...ids)', { ids: query.amenityIds })
            .groupBy('ba.boardroom_id')
            .having('COUNT(DISTINCT ba.amenity_id) = :cnt', { cnt: query.amenityIds!.length })
            .getQuery();
          return `room.id IN ${sq}`;
        });
      }

      return BoardroomResponseDto.collection(await qb.getMany());
    } catch (error) {
      this.logger.error('Failed to fetch boardrooms', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<BoardroomResponseDto> {
    try {
      return BoardroomResponseDto.fromEntity(await this.findOneEntity(id));
    } catch (error) {
      this.logger.error(`Failed to fetch boardroom ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreateBoardroomDto, actorId?: string): Promise<BoardroomResponseDto> {
    try {
      const clash = await this.repo.findOne({ where: { name: dto.name } });
      if (clash) throw new ConflictException(`Boardroom "${dto.name}" already exists`);

      const amenities = dto.amenityIds?.length ? await this.resolveAmenities(dto.amenityIds) : [];

      const room = this.repo.create({
        name: dto.name,
        code: dto.code ?? null,
        description: dto.description ?? null,
        capacity: dto.capacity,
        location: dto.location ?? null,
        floor: dto.floor ?? null,
        building: dto.building ?? null,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
        isBookable: dto.isBookable ?? true,
        requiresApproval: dto.requiresApproval ?? false,
        openingTime: dto.openingTime ?? '08:00',
        closingTime: dto.closingTime ?? '18:00',
        minimumBookingMinutes: dto.minimumBookingMinutes ?? 15,
        maximumBookingMinutes: dto.maximumBookingMinutes ?? 480,
        bufferTimeBeforeMinutes: dto.bufferTimeBeforeMinutes ?? 0,
        bufferTimeAfterMinutes: dto.bufferTimeAfterMinutes ?? 0,
        equipmentStatus: dto.equipmentStatus,
        amenities,
      });

      const saved = await this.repo.save(room);
      await this.auditLogs.record({
        action: 'boardroom.created',
        entity: 'Boardroom',
        entityId: saved.id,
        actorId: actorId ?? null,
        after: { name: saved.name, capacity: saved.capacity, location: saved.location },
      });
      return BoardroomResponseDto.fromEntity(saved);
    } catch (error) {
      this.logger.error('Failed to create boardroom', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateBoardroomDto, actorId?: string): Promise<BoardroomResponseDto> {
    try {
      const room = await this.findOneEntity(id);
      const before = { name: room.name, capacity: room.capacity, isActive: room.isActive };

      if (dto.name !== undefined && dto.name !== room.name) {
        const clash = await this.repo.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Boardroom "${dto.name}" already exists`);
        room.name = dto.name;
      }
      if (dto.code !== undefined) room.code = dto.code ?? null;
      if (dto.description !== undefined) room.description = dto.description ?? null;
      if (dto.capacity !== undefined) room.capacity = dto.capacity;
      if (dto.location !== undefined) room.location = dto.location ?? null;
      if (dto.floor !== undefined) room.floor = dto.floor ?? null;
      if (dto.building !== undefined) room.building = dto.building ?? null;
      if (dto.imageUrl !== undefined) room.imageUrl = dto.imageUrl ?? null;
      if (dto.isActive !== undefined) room.isActive = dto.isActive;
      if (dto.isBookable !== undefined) room.isBookable = dto.isBookable;
      if (dto.requiresApproval !== undefined) room.requiresApproval = dto.requiresApproval;
      if (dto.openingTime !== undefined) room.openingTime = dto.openingTime;
      if (dto.closingTime !== undefined) room.closingTime = dto.closingTime;
      if (dto.minimumBookingMinutes !== undefined) room.minimumBookingMinutes = dto.minimumBookingMinutes;
      if (dto.maximumBookingMinutes !== undefined) room.maximumBookingMinutes = dto.maximumBookingMinutes;
      if (dto.bufferTimeBeforeMinutes !== undefined) room.bufferTimeBeforeMinutes = dto.bufferTimeBeforeMinutes;
      if (dto.bufferTimeAfterMinutes !== undefined) room.bufferTimeAfterMinutes = dto.bufferTimeAfterMinutes;
      if (dto.equipmentStatus !== undefined) room.equipmentStatus = dto.equipmentStatus;
      if (dto.amenityIds !== undefined) {
        room.amenities = dto.amenityIds.length ? await this.resolveAmenities(dto.amenityIds) : [];
      }

      const saved = await this.repo.save(room);
      await this.auditLogs.record({
        action: 'boardroom.updated',
        entity: 'Boardroom',
        entityId: id,
        actorId: actorId ?? null,
        before,
        after: { name: saved.name, capacity: saved.capacity, isActive: saved.isActive },
      });
      return BoardroomResponseDto.fromEntity(saved);
    } catch (error) {
      this.logger.error(`Failed to update boardroom ${id}`, error);
      throw error;
    }
  }

  async remove(id: string, actorId?: string): Promise<void> {
    try {
      const room = await this.findOneEntity(id);

      const activeBookings = await this.bookingsRepo.count({
        where: { boardroomId: room.id, status: BookingStatus.APPROVED },
      });
      if (activeBookings > 0) {
        throw new BadRequestException(`Cannot delete boardroom "${room.name}" — it has ${activeBookings} active booking(s)`);
      }

      await this.repo.delete(room.id);
      await this.auditLogs.record({
        action: 'boardroom.deleted',
        entity: 'Boardroom',
        entityId: id,
        actorId: actorId ?? null,
        before: { name: room.name },
      });
    } catch (error) {
      this.logger.error(`Failed to remove boardroom ${id}`, error);
      throw error;
    }
  }

  async getAvailability(id: string, query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    try {
      const room = await this.findOneEntity(id);
      const slotMinutes = 30;
      const [openH, openM] = room.openingTime.split(':').map(Number);
      const [closeH, closeM] = room.closingTime.split(':').map(Number);

      const dayStart = new Date(`${query.date}T${room.openingTime}:00`);
      const dayEnd = new Date(`${query.date}T${room.closingTime}:00`);

      const [bookings, blocks] = await Promise.all([
        this.bookingsRepo
          .createQueryBuilder('b')
          .where('b.boardroomId = :id', { id })
          .andWhere('b.status IN (:...statuses)', { statuses: [BookingStatus.PENDING_APPROVAL, BookingStatus.APPROVED] })
          .andWhere('b.startDateTime < :dayEnd', { dayEnd })
          .andWhere('b.endDateTime > :dayStart', { dayStart })
          .getMany(),
        this.blocksRepo
          .createQueryBuilder('bl')
          .where('bl.boardroomId = :id', { id })
          .andWhere('bl.isActive = true')
          .andWhere('bl.startTime < :dayEnd', { dayEnd })
          .andWhere('bl.endTime > :dayStart', { dayStart })
          .getMany(),
      ]);

      const slots: TimeSlot[] = [];
      let cursor = openH * 60 + openM;
      const closeTotal = closeH * 60 + closeM;

      while (cursor + slotMinutes <= closeTotal) {
        const startStr = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
        const endMin = cursor + slotMinutes;
        const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

        const slotStart = new Date(`${query.date}T${startStr}:00`);
        const slotEnd = new Date(`${query.date}T${endStr}:00`);

        const blockedByBooking = bookings.find((b) => b.startDateTime < slotEnd && b.endDateTime > slotStart);
        const blockedByBlock = blocks.find((bl) => bl.startTime < slotEnd && bl.endTime > slotStart);

        const available = !blockedByBooking && !blockedByBlock;
        const reason = blockedByBlock
          ? `Room block: ${blockedByBlock.reason}`
          : blockedByBooking
            ? 'Booked'
            : undefined;

        slots.push({ start: startStr, end: endStr, available, reason });
        cursor += slotMinutes;
      }

      return {
        boardroomId: id,
        date: query.date,
        openingTime: room.openingTime,
        closingTime: room.closingTime,
        slots,
      };
    } catch (error) {
      this.logger.error(`Failed to get availability for boardroom ${id}`, error);
      throw error;
    }
  }

  private async findOneEntity(id: string): Promise<Boardroom> {
    const room = await this.repo.findOne({ where: { id }, relations: { amenities: true } });
    if (!room) throw new NotFoundException(`Boardroom ${id} not found`);
    return room;
  }

  private async resolveAmenities(ids: string[]): Promise<Amenity[]> {
    const found = await this.amenitiesRepo.find({ where: { id: In(ids) } });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((a) => a.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Unknown amenity ids: ${missing.join(', ')}`);
    }
    return found;
  }
}
