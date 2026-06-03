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
import { Boardroom } from '../entities/boardroom.entity';
import { BoardroomQueryDto } from '../dto/boardroom-query.dto';
import { CreateBoardroomDto } from '../dto/create-boardroom.dto';
import { UpdateBoardroomDto } from '../dto/update-boardroom.dto';

@Injectable()
export class BoardroomsService {
  private readonly logger = new Logger(BoardroomsService.name);

  constructor(
    @InjectRepository(Boardroom)
    private readonly boardroomsRepository: Repository<Boardroom>,
    @InjectRepository(Amenity)
    private readonly amenitiesRepository: Repository<Amenity>,
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
