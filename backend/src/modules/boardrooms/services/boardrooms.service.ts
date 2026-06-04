import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Amenity } from '../../amenities/entities/amenity.entity';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { BoardroomBlock } from '../../boardroom-blocks/entities/boardroom-block.entity';
import { Boardroom } from '../entities/boardroom.entity';
import { BoardroomQueryDto } from '../dto/boardroom-query.dto';
import { AvailabilityQueryDto, AvailabilityResponseDto, TimeSlot } from '../dto/availability-query.dto';
import { CreateBoardroomDto } from '../dto/create-boardroom.dto';
import { UpdateBoardroomDto } from '../dto/update-boardroom.dto';

const ACTIVE_STATUSES = [BookingStatus.Pending, BookingStatus.Confirmed];
const SLOT_INTERVAL_MINUTES = 30;

@Injectable()
export class BoardroomsService {
  private readonly logger = new Logger(BoardroomsService.name);

  constructor(
    @InjectRepository(Boardroom)
    private readonly boardroomsRepository: Repository<Boardroom>,
    @InjectRepository(Amenity)
    private readonly amenitiesRepository: Repository<Amenity>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(BoardroomBlock)
    private readonly blocksRepository: Repository<BoardroomBlock>,
  ) {}

  async findAll(query: BoardroomQueryDto = {}): Promise<Boardroom[]> {
    try {
    const qb = this.boardroomsRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.amenities', 'amenity')
      .orderBy('b.name', 'ASC');

    if (query.activeOnly) {
      qb.andWhere('b.isActive = :active', { active: true });
    }
    if (query.minCapacity !== undefined) {
      qb.andWhere('b.capacity >= :minCapacity', { minCapacity: query.minCapacity });
    }
    if (query.location) {
      qb.andWhere('LOWER(b.location) LIKE :location', {
        location: `%${query.location.toLowerCase()}%`,
      });
    }
    if (query.amenityIds && query.amenityIds.length > 0) {
      // Subquery: boardroom must have ALL requested amenities
      for (const [i, amenityId] of query.amenityIds.entries()) {
        const param = `amenityId_${i}`;
        qb.andWhere(
          `EXISTS (SELECT 1 FROM boardroom_amenities ba WHERE ba.boardroom_id = b.id AND ba.amenity_id = :${param})`,
          { [param]: amenityId },
        );
      }
    }

    return qb.getMany();
    } catch (err) { this.rethrow(err, 'findAll boardrooms'); }
  }

  async findOne(id: string): Promise<Boardroom> {
    try {
      const boardroom = await this.boardroomsRepository.findOne({ where: { id } });
      if (!boardroom) throw new NotFoundException(`Boardroom ${id} not found`);
      return boardroom;
    } catch (err) { this.rethrow(err, 'findOne boardroom'); }
  }

  async create(dto: CreateBoardroomDto): Promise<Boardroom> {
    try {
    const clash = await this.boardroomsRepository.findOne({ where: { name: dto.name } });
    if (clash) {
      throw new ConflictException(`Boardroom "${dto.name}" already exists`);
    }

    const amenities = await this.resolveAmenities(dto.amenityIds);
    const boardroom = this.boardroomsRepository.create({
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
    return this.boardroomsRepository.save(boardroom);
    } catch (err) { this.rethrow(err, 'create boardroom'); }
  }

  async update(id: string, dto: UpdateBoardroomDto): Promise<Boardroom> {
    try {
    const boardroom = await this.findOne(id);

    if (dto.name !== undefined && dto.name !== boardroom.name) {
      const clash = await this.boardroomsRepository.findOne({ where: { name: dto.name } });
      if (clash) {
        throw new ConflictException(`Boardroom "${dto.name}" already exists`);
      }
      boardroom.name = dto.name;
    }
    if (dto.description !== undefined) boardroom.description = dto.description;
    if (dto.capacity !== undefined) boardroom.capacity = dto.capacity;
    if (dto.location !== undefined) boardroom.location = dto.location;
    if (dto.code !== undefined) boardroom.code = dto.code ?? null;
    if (dto.floor !== undefined) boardroom.floor = dto.floor ?? null;
    if (dto.building !== undefined) boardroom.building = dto.building ?? null;
    if (dto.imageUrl !== undefined) boardroom.imageUrl = dto.imageUrl ?? null;
    if (dto.isActive !== undefined) boardroom.isActive = dto.isActive;
    if (dto.isBookable !== undefined) boardroom.isBookable = dto.isBookable;
    if (dto.requiresApproval !== undefined) boardroom.requiresApproval = dto.requiresApproval;
    if (dto.openingTime !== undefined) boardroom.openingTime = dto.openingTime;
    if (dto.closingTime !== undefined) boardroom.closingTime = dto.closingTime;
    if (dto.minimumBookingMinutes !== undefined) boardroom.minimumBookingMinutes = dto.minimumBookingMinutes;
    if (dto.maximumBookingMinutes !== undefined) boardroom.maximumBookingMinutes = dto.maximumBookingMinutes;
    if (dto.bufferTimeBeforeMinutes !== undefined) boardroom.bufferTimeBeforeMinutes = dto.bufferTimeBeforeMinutes;
    if (dto.bufferTimeAfterMinutes !== undefined) boardroom.bufferTimeAfterMinutes = dto.bufferTimeAfterMinutes;
    if (dto.equipmentStatus !== undefined) boardroom.equipmentStatus = dto.equipmentStatus;
    if (dto.amenityIds !== undefined) {
      boardroom.amenities = await this.resolveAmenities(dto.amenityIds);
    }

    return this.boardroomsRepository.save(boardroom);
    } catch (err) { this.rethrow(err, 'update boardroom'); }
  }

  async getAvailability(id: string, query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    try {
      const boardroom = await this.findOne(id);

      const [year, month, day] = query.date.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

      const [openH, openM] = boardroom.openingTime.split(':').map(Number);
      const [closeH, closeM] = boardroom.closingTime.split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      // Fetch active bookings and maintenance blocks for the day
      const bookings = await this.bookingsRepository
        .createQueryBuilder('b')
        .where('b.boardroomId = :id', { id })
        .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
        .andWhere('b.startTime < :dayEnd AND b.endTime > :dayStart', { dayStart, dayEnd })
        .orderBy('b.startTime', 'ASC')
        .getMany();

      const blocks = await this.blocksRepository
        .createQueryBuilder('blk')
        .where('blk.boardroomId = :id', { id })
        .andWhere('blk.isActive = true')
        .andWhere('blk.startTime < :dayEnd AND blk.endTime > :dayStart', { dayStart, dayEnd })
        .orderBy('blk.startTime', 'ASC')
        .getMany();

      // Build busy intervals (start/end as minutes-from-midnight)
      interface BusyInterval { start: number; end: number; reason: string }
      const busy: BusyInterval[] = [];
      for (const b of bookings) {
        const s = new Date(b.startTime);
        const e = new Date(b.endTime);
        const startMins = s.getHours() * 60 + s.getMinutes();
        const endMins = e.getHours() * 60 + e.getMinutes();
        const buffer = boardroom.bufferTimeBeforeMinutes + boardroom.bufferTimeAfterMinutes;
        busy.push({
          start: Math.max(openMinutes, startMins - boardroom.bufferTimeBeforeMinutes),
          end: Math.min(closeMinutes, endMins + boardroom.bufferTimeAfterMinutes),
          reason: buffer > 0 ? `${b.title} (+ ${buffer} min buffer)` : b.title,
        });
      }
      for (const blk of blocks) {
        const s = new Date(blk.startTime);
        const e = new Date(blk.endTime);
        busy.push({
          start: s.getHours() * 60 + s.getMinutes(),
          end: e.getHours() * 60 + e.getMinutes(),
          reason: `Blocked: ${blk.reason}`,
        });
      }

      // Generate 30-minute slots within operating hours
      const slots: TimeSlot[] = [];
      for (let m = openMinutes; m < closeMinutes; m += SLOT_INTERVAL_MINUTES) {
        const slotEnd = Math.min(m + SLOT_INTERVAL_MINUTES, closeMinutes);
        const conflict = busy.find((b) => b.start < slotEnd && b.end > m);
        slots.push({
          start: minutesToTimeString(m),
          end: minutesToTimeString(slotEnd),
          available: !conflict,
          ...(conflict ? { reason: conflict.reason } : {}),
        });
      }

      return {
        boardroomId: id,
        date: query.date,
        openingTime: boardroom.openingTime,
        closingTime: boardroom.closingTime,
        slots,
      };
    } catch (err) { this.rethrow(err, 'getAvailability'); }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.boardroomsRepository.delete(id);
      if (result.affected === 0) throw new NotFoundException(`Boardroom ${id} not found`);
    } catch (err) { this.rethrow(err, 'remove boardroom'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  private async resolveAmenities(ids: string[] | undefined): Promise<Amenity[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const found = await this.amenitiesRepository.find({ where: { id: In(ids) } });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((a) => a.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Unknown amenity ids: ${missing.join(', ')}`);
    }
    return found;
  }
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
