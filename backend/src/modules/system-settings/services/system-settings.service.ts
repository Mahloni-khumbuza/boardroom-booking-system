import { ConflictException, Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { SystemSetting } from '../entities/system-setting.entity';
import { CreateSystemSettingDto } from '../dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from '../dto/update-system-setting.dto';
import { SystemSettingResponseDto } from '../dto/system-setting-response.dto';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
    private readonly auditLogs: AuditLogsService,
    @Inject('automapper:nestjs:default') private readonly mapper: any,
  ) {}

  async findAll(): Promise<SystemSettingResponseDto[]> {
    try {
      const settings = await this.repo.find({ order: { key: 'ASC' } });
      return this.mapper.mapArray(settings, SystemSetting, SystemSettingResponseDto);
    } catch (error) {
      this.logger.error('Failed to fetch system settings', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<SystemSettingResponseDto> {
    try {
      const setting = await this.repo.findOne({ where: { id } });
      if (!setting) throw new NotFoundException(`Setting ${id} not found`);
      return this.mapper.map(setting, SystemSetting, SystemSettingResponseDto);
    } catch (error) {
      this.logger.error(`Failed to fetch setting ${id}`, error);
      throw error;
    }
  }

  findByKey(key: string): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  private async findOneEntity(id: string): Promise<SystemSetting> {
    const setting = await this.repo.findOne({ where: { id } });
    if (!setting) throw new NotFoundException(`Setting ${id} not found`);
    return setting;
  }

  async create(dto: CreateSystemSettingDto, actorId?: string): Promise<SystemSettingResponseDto> {
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
      return this.mapper.map(saved, SystemSetting, SystemSettingResponseDto);
    } catch (error) {
      this.logger.error('Failed to create system setting', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateSystemSettingDto, actorId?: string): Promise<SystemSettingResponseDto> {
    try {
      const setting = await this.findOneEntity(id);
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
      return this.mapper.map(saved, SystemSetting, SystemSettingResponseDto);
    } catch (error) {
      this.logger.error(`Failed to update setting ${id}`, error);
      throw error;
    }
  }

  async remove(id: string, actorId?: string): Promise<void> {
    try {
      const setting = await this.findOneEntity(id);
      await this.repo.delete(id);
      await this.auditLogs.record({
        action: 'system_setting.removed',
        entity: 'system_setting',
        entityId: id,
        actorId: actorId ?? null,
        before: { key: setting.key, value: setting.value },
      });
    } catch (error) {
      this.logger.error(`Failed to remove setting ${id}`, error);
      throw error;
    }
  }
}
