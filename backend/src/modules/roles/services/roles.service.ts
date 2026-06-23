import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../entities/role.entity';
import { RoleResponseDto } from '../dto/role-response.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject('automapper:nestjs:default') private readonly mapper: any,
  ) {}

  async findAll(): Promise<RoleResponseDto[]> {
    try {
      const roles = await this.rolesRepository.find({ order: { name: 'ASC' }, relations: { permissions: true } });
      return this.mapper.mapArray(roles, Role, RoleResponseDto);
    } catch (error) {
      this.logger.error('Failed to fetch roles', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    try {
      const role = await this.rolesRepository.findOne({ where: { id }, relations: { permissions: true } });
      if (!role) throw new NotFoundException(`Role ${id} not found`);
      return this.mapper.map(role, Role, RoleResponseDto);
    } catch (error) {
      this.logger.error(`Failed to fetch role ${id}`, error);
      throw error;
    }
  }

  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    try {
      const existing = await this.rolesRepository.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);
      const permissions = await this.resolvePermissions(dto.permissionIds);
      const role = this.rolesRepository.create({ name: dto.name, description: dto.description ?? null, permissions });
      return this.mapper.map(await this.rolesRepository.save(role), Role, RoleResponseDto);
    } catch (error) {
      this.logger.error('Failed to create role', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    try {
      const role = await this.rolesRepository.findOne({ where: { id }, relations: { permissions: true } });
      if (!role) throw new NotFoundException(`Role ${id} not found`);
      if (dto.name !== undefined && dto.name !== role.name) {
        const clash = await this.rolesRepository.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Role "${dto.name}" already exists`);
        role.name = dto.name;
      }
      if (dto.description !== undefined) role.description = dto.description;
      if (dto.permissionIds !== undefined) role.permissions = await this.resolvePermissions(dto.permissionIds);
      return this.mapper.map(await this.rolesRepository.save(role), Role, RoleResponseDto);
    } catch (error) {
      this.logger.error(`Failed to update role ${id}`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const role = await this.findOne(id);
      const inUse = await this.usersRepository.count({ where: { roleId: role.id } });
      if (inUse > 0) {
        throw new ConflictException(`Cannot delete role "${role.name}" Ã¢â‚¬â€ ${inUse} user(s) still assigned`);
      }
      await this.rolesRepository.delete(role.id);
    } catch (error) {
      this.logger.error(`Failed to remove role ${id}`, error);
      throw error;
    }
  }

  private async resolvePermissions(ids: string[] | undefined): Promise<Permission[]> {
    if (!ids || ids.length === 0) return [];
    const found = await this.permissionsRepository.find({ where: { id: In(ids) } });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Unknown permission ids: ${missing.join(', ')}`);
    }
    return found;
  }
}
