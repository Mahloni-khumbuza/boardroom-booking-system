import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
    } catch (err) { return this.rethrow(err, 'findAll amenities'); }
  }

  async findOne(id: string): Promise<Amenity> {
    try {
      const amenity = await this.amenitiesRepository.findOne({ where: { id } });
      if (!amenity) throw new NotFoundException(`Amenity ${id} not found`);
      return amenity;
    } catch (err) { return this.rethrow(err, 'findOne amenity'); }
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
    } catch (err) { return this.rethrow(err, 'create amenity'); }
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
    } catch (err) { return this.rethrow(err, 'update amenity'); }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.amenitiesRepository.delete(id);
      if (result.affected === 0) throw new NotFoundException(`Amenity ${id} not found`);
    } catch (err) { return this.rethrow(err, 'remove amenity'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof ConflictException || err instanceof NotFoundException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
