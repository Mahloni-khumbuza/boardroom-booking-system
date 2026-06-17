import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from '../entities/amenity.entity';
import { CreateAmenityDto } from '../dto/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/update-amenity.dto';

@Injectable()
export class AmenitiesService {
  private readonly logger = new Logger(AmenitiesService.name);

  constructor(
    @InjectRepository(Amenity)
    private readonly amenitiesRepository: Repository<Amenity>,
  ) {}

  async findAll(): Promise<Amenity[]> {
    try {
      return await this.amenitiesRepository.find({ order: { name: 'ASC' } });
    } catch (error) {
      this.logger.error('Failed to fetch amenities', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Amenity> {
    try {
      const amenity = await this.amenitiesRepository.findOne({ where: { id } });
      if (!amenity) throw new NotFoundException(`Amenity ${id} not found`);
      return amenity;
    } catch (error) {
      this.logger.error(`Failed to fetch amenity ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreateAmenityDto): Promise<Amenity> {
    try {
      const clash = await this.amenitiesRepository.findOne({ where: { name: dto.name } });
      if (clash) throw new ConflictException(`Amenity "${dto.name}" already exists`);
      const amenity = this.amenitiesRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
      });
      return await this.amenitiesRepository.save(amenity);
    } catch (error) {
      this.logger.error('Failed to create amenity', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateAmenityDto): Promise<Amenity> {
    try {
      const amenity = await this.findOne(id);
      if (dto.name !== undefined && dto.name !== amenity.name) {
        const clash = await this.amenitiesRepository.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Amenity "${dto.name}" already exists`);
        amenity.name = dto.name;
      }
      if (dto.description !== undefined) amenity.description = dto.description;
      if (dto.icon !== undefined) amenity.icon = dto.icon;
      return await this.amenitiesRepository.save(amenity);
    } catch (error) {
      this.logger.error(`Failed to update amenity ${id}`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const amenity = await this.amenitiesRepository.findOne({ where: { id } });
      if (!amenity) throw new NotFoundException(`Amenity ${id} not found`);
      await this.amenitiesRepository.delete(id);
    } catch (error) {
      this.logger.error(`Failed to remove amenity ${id}`, error);
      throw error;
    }
  }
}
