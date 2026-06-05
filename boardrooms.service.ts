import {
  BadRequestException,
  ConflictException,
  Injectable,
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
  constructor(
    @InjectRepository(Boardroom)
    private readonly boardroomsRepository: Repository<Boardroom>,
    @InjectRepository(Amenity)
    private readonly amenitiesRepository: Repository<Amenity>,
  ) {}

  findAll(query: BoardroomQueryDto = {}): Promise<Boardroom[]> {
    return this.boardroomsRepository.find({
      where: query.activeOnly ? { isActive: true } : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Boardroom> {
    const boardroom = await this.boardroomsRepository.findOne({ where: { id } });
    if (!boardroom) {
      throw new NotFoundException(`Boardroom ${id} not found`);
    }
    return boardroom;
  }

  async create(dto: CreateBoardroomDto): Promise<Boardroom> {
    const clash = await this.boardroomsRepository.findOne({ where: { name: dto.name } });
    if (clash) {
      throw new ConflictException(`Boardroom "${dto.name}" already exists`);
    }

    const amenities = await this.resolveAmenities(dto.amenityIds);
    const boardroom = this.boardroomsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      capacity: dto.capacity,
      location: dto.location ?? null,
      isActive: dto.isActive ?? true,
      amenities,
    });
    return this.boardroomsRepository.save(boardroom);
  }

  async update(id: string, dto: UpdateBoardroomDto): Promise<Boardroom> {
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
    if (dto.isActive !== undefined) boardroom.isActive = dto.isActive;
    if (dto.amenityIds !== undefined) {
      boardroom.amenities = await this.resolveAmenities(dto.amenityIds);
    }

    return this.boardroomsRepository.save(boardroom);
  }

  async remove(id: string): Promise<void> {
    const result = await this.boardroomsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Boardroom ${id} not found`);
    }
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
