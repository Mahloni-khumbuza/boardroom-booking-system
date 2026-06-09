import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { SystemSetting } from '../entities/system-setting.entity';
import { CreateSystemSettingDto } from '../dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from '../dto/update-system-setting.dto';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(): Promise<SystemSetting[]> {
    try {
      return await this.repo.find({ order: { key: 'ASC' } });
    } catch (err) { return this.rethrow(err, 'findAll settings'); }
  }

  async findOne(id: string): Promise<SystemSetting> {
    try {
      const setting = await this.repo.findOne({ where: { id } });
      if (!setting) throw new NotFoundException(`Setting ${id} not found`);
      return setting;
    } catch (err) { return this.rethrow(err, 'findOne setting'); }
  }

  findByKey(key: string): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async create(dto: CreateSystemSettingDto, actorId?: string): Promise<SystemSetting> {
    try {
      const clash = await this.repo.findOne({ where: { key: dto.key } });
      if (clash) throw new ConflictException(`Setting "${dto.key}" already exists`);
      const setting = this.repo.create({ key: dto.key, value: dto.value ?? null, description: dto.description ?? null });
      const saved = await this.repo.save(setting);
      await this.auditLogs.record({
        action: 'system_setting.created',
        entity: 'system_setting',
        entityId: saved.id,
        actorId: actorId ?? null,
        after: { key: saved.key, value: saved.value },
      });
      return saved;
    } catch (err) { return this.rethrow(err, 'create setting'); }
  }

  async update(id: string, dto: UpdateSystemSettingDto, actorId?: string): Promise<SystemSetting> {
    try {
      const setting = await this.findOne(id);
      const before = { key: setting.key, value: setting.value };
      if (dto.value !== undefined) setting.value = dto.value;
      if (dto.description !== undefined) setting.description = dto.description;
      const saved = await this.repo.save(setting);
      await this.auditLogs.record({
        action: 'system_setting.updated',
        entity: 'system_setting',
        entityId: id,
        actorId: actorId ?? null,
        before,
        after: { key: saved.key, value: saved.value },
      });
      return saved;
    } catch (err) { return this.rethrow(err, 'update setting'); }
  }

  async remove(id: string, actorId?: string): Promise<void> {
    try {
      const setting = await this.repo.findOne({ where: { id } });
      if (!setting) throw new NotFoundException(`Setting ${id} not found`);
      await this.repo.delete(id);
      await this.auditLogs.record({
        action: 'system_setting.removed',
        entity: 'system_setting',
        entityId: id,
        actorId: actorId ?? null,
        before: { key: setting.key, value: setting.value },
      });
    } catch (err) { return this.rethrow(err, 'remove setting'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof ConflictException || err instanceof NotFoundException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
