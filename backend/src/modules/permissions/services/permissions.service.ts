import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    try {
      return await this.permissionsRepository.find({ order: { name: 'ASC' } });
    } catch (error) {
      this.logger.error('Failed to fetch permissions', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Permission> {
    try {
      const permission = await this.permissionsRepository.findOne({ where: { id } });
      if (!permission) throw new NotFoundException(`Permission ${id} not found`);
      return permission;
    } catch (error) {
      this.logger.error(`Failed to fetch permission ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    try {
      const exists = await this.permissionsRepository.findOne({ where: { name: dto.name } });
      if (exists) throw new ConflictException(`Permission "${dto.name}" already exists`);
      const permission = this.permissionsRepository.create({
        name: dto.name,
        description: dto.description ?? null,
      });
      return await this.permissionsRepository.save(permission);
    } catch (error) {
      this.logger.error('Failed to create permission', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    try {
      const permission = await this.findOne(id);
      if (dto.name !== undefined && dto.name !== permission.name) {
        const clash = await this.permissionsRepository.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Permission "${dto.name}" already exists`);
        permission.name = dto.name;
      }
      if (dto.description !== undefined) permission.description = dto.description;
      return await this.permissionsRepository.save(permission);
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
