import { ConflictException, Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from '../entities/amenity.entity';
import { AmenityResponseDto } from '../dto/amenity-response.dto';
import { CreateAmenityDto } from '../dto/create-amenity.dto';
import { UpdateAmenityDto } from '../dto/update-amenity.dto';

@Injectable()
export class AmenitiesService {
  private readonly logger = new Logger(AmenitiesService.name);

  constructor(
    @InjectRepository(Amenity)
    private readonly amenitiesRepository: Repository<Amenity>,
    @Inject('automapper:nestjs:default') private readonly mapper: any,
  ) {}

  async findAll(): Promise<AmenityResponseDto[]> {
    try {
      const amenities = await this.amenitiesRepository.find({ order: { name: 'ASC' } });
      return this.mapper.mapArray(amenities, Amenity, AmenityResponseDto);
    } catch (error) {
      this.logger.error('Failed to fetch amenities', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<AmenityResponseDto> {
    try {
      const amenity = await this.amenitiesRepository.findOne({ where: { id } });
      if (!amenity) throw new NotFoundException(`Amenity ${id} not found`);
      return this.mapper.map(amenity, Amenity, AmenityResponseDto);
    } catch (error) {
      this.logger.error(`Failed to fetch amenity ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreateAmenityDto): Promise<AmenityResponseDto> {
    try {
      const clash = await this.amenitiesRepository.findOne({ where: { name: dto.name } });
      if (clash) throw new ConflictException(`Amenity "${dto.name}" already exists`);
      const amenity = this.amenitiesRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
      });
      return this.mapper.map(await this.amenitiesRepository.save(amenity), Amenity, AmenityResponseDto);
    } catch (error) {
      this.logger.error('Failed to create amenity', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateAmenityDto): Promise<AmenityResponseDto> {
    try {
      const amenity = await this.amenitiesRepository.findOne({ where: { id } });
      if (!amenity) throw new NotFoundException(`Amenity ${id} not found`);
      if (dto.name !== undefined && dto.name !== amenity.name) {
        const clash = await this.amenitiesRepository.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Amenity "${dto.name}" already exists`);
        amenity.name = dto.name;
      }
      if (dto.description !== undefined) amenity.description = dto.description;
      if (dto.icon !== undefined) amenity.icon = dto.icon;
      return this.mapper.map(await this.amenitiesRepository.save(amenity), Amenity, AmenityResponseDto);
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
