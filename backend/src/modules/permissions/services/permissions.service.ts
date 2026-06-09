import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
    } catch (err) { return this.rethrow(err, 'findAll permissions'); }
  }

  async findOne(id: string): Promise<Permission> {
    try {
      const permission = await this.permissionsRepository.findOne({ where: { id } });
      if (!permission) throw new NotFoundException(`Permission ${id} not found`);
      return permission;
    } catch (err) { return this.rethrow(err, 'findOne permission'); }
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
    } catch (err) { return this.rethrow(err, 'create permission'); }
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
    } catch (err) { return this.rethrow(err, 'update permission'); }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.permissionsRepository.delete(id);
      if (result.affected === 0) throw new NotFoundException(`Permission ${id} not found`);
    } catch (err) { return this.rethrow(err, 'remove permission'); }
  }

  private rethrow(err: unknown, context: string): never {
    if (err instanceof ConflictException || err instanceof NotFoundException) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
