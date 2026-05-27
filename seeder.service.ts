import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';

interface SeedRoleDefinition {
  name: string;
  description: string;
  permissions: string[];
}

const DEFAULT_PERMISSIONS: Array<{ name: string; description: string }> = [
  { name: 'users:read', description: 'View users' },
  { name: 'users:write', description: 'Create or update users' },
  { name: 'users:delete', description: 'Delete users' },
  { name: 'roles:read', description: 'View roles' },
  { name: 'roles:write', description: 'Create or update roles' },
  { name: 'boardrooms:read', description: 'View boardrooms' },
  { name: 'boardrooms:write', description: 'Create or update boardrooms' },
  { name: 'boardrooms:delete', description: 'Delete boardrooms' },
  { name: 'bookings:read', description: 'View bookings' },
  { name: 'bookings:write', description: 'Create or update bookings' },
  { name: 'bookings:delete', description: 'Cancel or delete bookings' },
  { name: 'audit-logs:read', description: 'View audit logs' },
  { name: 'settings:read', description: 'View system settings' },
  { name: 'settings:write', description: 'Update system settings' },
];

const DEFAULT_ROLES: SeedRoleDefinition[] = [
  {
    name: 'SuperAdmin',
    description: 'Full system access',
    permissions: DEFAULT_PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'Admin',
    description: 'Administrative access (no destructive user actions)',
    permissions: [
      'users:read',
      'users:write',
      'roles:read',
      'boardrooms:read',
      'boardrooms:write',
      'boardrooms:delete',
      'bookings:read',
      'bookings:write',
      'bookings:delete',
      'audit-logs:read',
      'settings:read',
      'settings:write',
    ],
  },
  {
    name: 'Manager',
    description: 'Manages boardrooms and bookings',
    permissions: [
      'boardrooms:read',
      'boardrooms:write',
      'bookings:read',
      'bookings:write',
      'bookings:delete',
    ],
  },
  {
    name: 'User',
    description: 'Standard user — can book boardrooms',
    permissions: ['boardrooms:read', 'bookings:read', 'bookings:write'],
  },
];

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.seedPermissions();
      const roles = await this.seedRoles();
      await this.seedSuperAdmin(roles);
    } catch (err) {
      this.logger.error(
        'Database seeding failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async seedPermissions(): Promise<Permission[]> {
    const existing = await this.permissionsRepository.find();
    const existingNames = new Set(existing.map((p) => p.name));
    const toCreate = DEFAULT_PERMISSIONS.filter((p) => !existingNames.has(p.name));

    if (toCreate.length > 0) {
      const created = await this.permissionsRepository.save(
        toCreate.map((p) => this.permissionsRepository.create(p)),
      );
      this.logger.log(`Seeded ${created.length} permissions`);
      return [...existing, ...created];
    }
    return existing;
  }

  private async seedRoles(): Promise<Map<string, Role>> {
    const permissions = await this.permissionsRepository.find();
    const permissionsByName = new Map(permissions.map((p) => [p.name, p]));
    const result = new Map<string, Role>();

    for (const def of DEFAULT_ROLES) {
      let role = await this.rolesRepository.findOne({
        where: { name: def.name },
        relations: { permissions: true },
      });

      const desiredPermissions = def.permissions
        .map((name) => permissionsByName.get(name))
        .filter((p): p is Permission => Boolean(p));

      if (!role) {
        role = this.rolesRepository.create({
          name: def.name,
          description: def.description,
          permissions: desiredPermissions,
        });
        role = await this.rolesRepository.save(role);
        this.logger.log(`Seeded role "${def.name}"`);
      } else {
        const existingNames = new Set((role.permissions ?? []).map((p) => p.name));
        const missing = desiredPermissions.filter((p) => !existingNames.has(p.name));
        if (missing.length > 0) {
          role.permissions = [...(role.permissions ?? []), ...missing];
          role = await this.rolesRepository.save(role);
          this.logger.log(
            `Updated role "${def.name}" with ${missing.length} new permissions`,
          );
        }
      }
      result.set(def.name, role);
    }

    return result;
  }

  private async seedSuperAdmin(roles: Map<string, Role>): Promise<void> {
    const email = this.configService.getOrThrow<string>('SUPER_ADMIN_EMAIL');
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      return;
    }

    const password = this.configService.getOrThrow<string>('SUPER_ADMIN_PASSWORD');
    const firstName = this.configService.get<string>('SUPER_ADMIN_FIRST_NAME', 'Super');
    const lastName = this.configService.get<string>('SUPER_ADMIN_LAST_NAME', 'Admin');
    const superAdminRole = roles.get('SuperAdmin');
    if (!superAdminRole) {
      throw new Error('SuperAdmin role was not seeded');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      isActive: true,
      role: superAdminRole,
    });
    await this.usersRepository.save(user);
    this.logger.log(`Seeded initial Super Admin user: ${email}`);
  }
}
