import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    try {
      const users = await this.usersRepository.find({
        order: { lastName: 'ASC', firstName: 'ASC' },
        relations: { role: { permissions: true } },
      });
      return users.map(UserResponseDto.fromEntity);
    } catch (err) { return this.rethrow(err, 'findAll users'); }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      return UserResponseDto.fromEntity(await this.findOneEntity(id));
    } catch (err) { return this.rethrow(err, 'findOne user'); }
  }

  async create(dto: CreateUserDto, _actor?: User): Promise<UserResponseDto> {
    try {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException(`Email "${dto.email}" is already registered`);
      const role = dto.roleId ? await this.resolveRole(dto.roleId) : null;
      const passwordHash = await import('bcrypt').then((b) => b.hash(dto.password, 10));
      const user = this.usersRepository.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber ?? null,
        department: dto.department ?? null,
        jobTitle: dto.jobTitle ?? null,
        isActive: dto.isActive ?? true,
        role,
        roleId: role?.id ?? null,
      });
      return UserResponseDto.fromEntity(await this.usersRepository.save(user));
    } catch (err) { return this.rethrow(err, 'create user'); }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.findOneEntity(id);
      if (dto.email !== undefined && dto.email !== user.email) {
        const clash = await this.usersRepository.findOne({ where: { email: dto.email } });
        if (clash) throw new ConflictException(`Email "${dto.email}" is already registered`);
        user.email = dto.email;
      }
      if (dto.firstName !== undefined) user.firstName = dto.firstName;
      if (dto.lastName !== undefined) user.lastName = dto.lastName;
      if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber ?? null;
      if (dto.department !== undefined) user.department = dto.department ?? null;
      if (dto.jobTitle !== undefined) user.jobTitle = dto.jobTitle ?? null;
      if (dto.isActive !== undefined) user.isActive = dto.isActive;
      if (dto.roleId !== undefined) {
        const role = dto.roleId ? await this.resolveRole(dto.roleId) : null;
        user.role = role;
        user.roleId = role?.id ?? null;
      }
      return UserResponseDto.fromEntity(await this.usersRepository.save(user));
    } catch (err) { return this.rethrow(err, 'update user'); }
  }

  async remove(id: string): Promise<void> {
    try {
      const user = await this.findOneEntity(id);
      await this.usersRepository.delete(user.id);
    } catch (err) { return this.rethrow(err, 'remove user'); }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: { role: { permissions: true } },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: { role: { permissions: true } },
    });
  }

  private async findOneEntity(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: { permissions: true } },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  private async resolveRole(roleId: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id: roleId }, relations: { permissions: true } });
    if (!role) throw new BadRequestException(`Role ${roleId} not found`);
    return role;
  }

  private rethrow(err: unknown, context: string): never {
    if (
      err instanceof BadRequestException ||
      err instanceof NotFoundException ||
      err instanceof ConflictException
    ) throw err;
    this.logger.error(`Unexpected error in ${context}`, err instanceof Error ? err.stack : String(err));
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
