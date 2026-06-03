import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { CreateSystemSettingDto } from '../dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from '../dto/update-system-setting.dto';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) {}

  async findAll(): Promise<SystemSetting[]> {
    try {
      return await this.repo.find({ order: { key: 'ASC' } });
    } catch (err) { this.rethrow(err, 'findAll settings'); }
  }

  async findOne(id: string): Promise<SystemSetting> {
    try {
      const setting = await this.repo.findOne({ where: { id } });
      if (!setting) throw new NotFoundException(`Setting ${id} not found`);
      return setting;
    } catch (err) { this.rethrow(err, 'findOne setting'); }
  }

  findByKey(key: string): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async create(dto: CreateSystemSettingDto): Promise<SystemSetting> {
    try {
      const clash = await this.repo.findOne({ where: { key: dto.key } });
      if (clash) throw new ConflictException(`Setting "${dto.key}" already exists`);
      const setting = this.repo.create({ key: dto.key, value: dto.value ?? null, description: dto.description ?? null });
      return await this.repo.save(setting);
    } catch (err) { this.rethrow(err, 'create setting'); }
  }

  async update(id: string, dto: UpdateSystemSettingDto): Promise<SystemSetting> {
    try {
      const setting = await this.findOne(id);
      if (dto.value !== undefined) setting.value = dto.value;
      if (dto.description !== undefined) setting.description = dto.description;
      return await this.repo.save(setting);
    } catch (err) { this.rethrow(err, 'update setting'); }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.repo.delete(id);
      if (result.affected === 0) throw new NotFoundException(`Setting ${id} not found`);
    } catch (err) { this.rethrow(err, 'remove setting'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof ConflictException || err instanceof NotFoundException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
