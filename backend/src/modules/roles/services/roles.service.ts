import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../entities/role.entity';
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
  ) {}

  async findAll(): Promise<Role[]> {
    try {
      return await this.rolesRepository.find({ order: { name: 'ASC' }, relations: { permissions: true } });
    } catch (err) { return this.rethrow(err, 'findAll roles'); }
  }

  async findOne(id: string): Promise<Role> {
    try {
      const role = await this.rolesRepository.findOne({ where: { id }, relations: { permissions: true } });
      if (!role) throw new NotFoundException(`Role ${id} not found`);
      return role;
    } catch (err) { return this.rethrow(err, 'findOne role'); }
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    try {
      const existing = await this.rolesRepository.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);
      const permissions = await this.resolvePermissions(dto.permissionIds);
      const role = this.rolesRepository.create({ name: dto.name, description: dto.description ?? null, permissions });
      return await this.rolesRepository.save(role);
    } catch (err) { return this.rethrow(err, 'create role'); }
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    try {
      const role = await this.findOne(id);
      if (dto.name !== undefined && dto.name !== role.name) {
        const clash = await this.rolesRepository.findOne({ where: { name: dto.name } });
        if (clash) throw new ConflictException(`Role "${dto.name}" already exists`);
        role.name = dto.name;
      }
      if (dto.description !== undefined) role.description = dto.description;
      if (dto.permissionIds !== undefined) role.permissions = await this.resolvePermissions(dto.permissionIds);
      return await this.rolesRepository.save(role);
    } catch (err) { return this.rethrow(err, 'update role'); }
  }

  async remove(id: string): Promise<void> {
    try {
      const role = await this.findOne(id);
      const inUse = await this.usersRepository.count({ where: { roleId: role.id } });
      if (inUse > 0) {
        throw new ConflictException(`Cannot delete role "${role.name}" — ${inUse} user(s) still assigned`);
      }
      await this.rolesRepository.delete(role.id);
    } catch (err) { return this.rethrow(err, 'remove role'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  private async resolvePermissions(ids: string[] | undefined): Promise<Permission[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const found = await this.permissionsRepository.find({ where: { id: In(ids) } });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Unknown permission ids: ${missing.join(', ')}`);
    }
    return found;
  }
}
