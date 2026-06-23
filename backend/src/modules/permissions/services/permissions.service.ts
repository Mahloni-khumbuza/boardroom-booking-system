import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { PermissionResponseDto } from '../dto/permission-response.dto';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @Inject('automapper:nestjs:default') private readonly mapper: any,
  ) {}

  async findAll(): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionsRepository.find({ order: { name: 'ASC' } });
      return this.mapper.mapArray(permissions, Permission, PermissionResponseDto);
    } catch (error) {
      this.logger.error('Failed to fetch permissions', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    try {
      const permission = await this.permissionsRepository.findOne({ where: { id } });
      if (!permission) throw new NotFoundException(`Permission ${id} not found`);
      return this.mapper.map(permission, Permission, PermissionResponseDto);
    } catch (error) {
      this.logger.error(`Failed to fetch permission ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    try {
      const exists = await this.permissionsRepository.findOne({ where: { name: dto.name } });
      if (exists) throw new ConflictException(`Permission "${dto.name}" already exists`);
      const permission = this.permissionsRepository.create({
        name: dto.name,
        description: dto.description ?? null,
      });
      return this.mapper.map(await this.permissionsRepository.save(permission), Permission, PermissionResponseDto);
    } catch (error) {
      this.logger.error('Failed to create permission', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    try {
      const permission = await this.permissionsRepository.findOne({ where: { id } });
      if (!permission) throw new NotFoundException(`Permission ${id} not found`);
      if (dto.name !== undefined && dto.name !== permission.name) {
        const clash = await this.permissionsRepository.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Permission "${dto.name}" already exists`);
        permission.name = dto.name;
      }
      if (dto.description !== undefined) permission.description = dto.description;
      return this.mapper.map(await this.permissionsRepository.save(permission), Permission, PermissionResponseDto);
    } catch (error) {
      this.logger.error(`Failed to update permission ${id}`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const permission = await this.permissionsRepository.findOne({ where: { id } });
      if (!permission) throw new NotFoundException(`Permission ${id} not found`);
      await this.permissionsRepository.delete(id);
    } catch (error) {
      this.logger.error(`Failed to remove permission ${id}`, error);
      throw error;
    }
  }
}
