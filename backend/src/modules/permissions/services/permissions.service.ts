import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const exists = await this.permissionsRepository.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Permission "${dto.name}" already exists`);
    const permission = this.permissionsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });
    return this.permissionsRepository.save(permission);
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    if (dto.name !== undefined && dto.name !== permission.name) {
      const clash = await this.permissionsRepository.findOne({ where: { name: dto.name } });
      if (clash) throw new ConflictException(`Permission "${dto.name}" already exists`);
      permission.name = dto.name;
    }
    if (dto.description !== undefined) permission.description = dto.description;
    return this.permissionsRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionsRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Permission ${id} not found`);
  }
}
