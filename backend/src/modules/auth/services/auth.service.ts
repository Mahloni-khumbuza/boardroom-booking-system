import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginResponseDto } from '../dto/login-response.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string | null;
  permissions: string[];
}

const DEFAULT_ROLE_NAME = 'User';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(user);
  }

  async register(dto: RegisterDto): Promise<LoginResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const role = await this.rolesRepository.findOne({
      where: { name: DEFAULT_ROLE_NAME },
      relations: { permissions: true },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      isActive: true,
      role: role ?? null,
    });

    const fresh = (await this.usersService.findById(user.id)) ?? user;
    return this.issueToken(fresh);
  }

  private issueToken(user: User): LoginResponseDto {
    const permissions = (user.role?.permissions ?? []).map((permission) => permission.name);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1d');

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name ?? null,
        permissions,
      },
    };
  }
}
