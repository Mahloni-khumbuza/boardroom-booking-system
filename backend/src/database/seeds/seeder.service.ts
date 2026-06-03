import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { SystemSetting } from '../../modules/system-settings/entities/system-setting.entity';
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
  { name: 'amenities:read', description: 'View amenities' },
  { name: 'amenities:write', description: 'Create or update amenities' },
  { name: 'amenities:delete', description: 'Delete amenities' },
  { name: 'boardroom-blocks:read', description: 'View boardroom maintenance blocks' },
  { name: 'boardroom-blocks:write', description: 'Create or update boardroom blocks' },
  { name: 'boardroom-blocks:delete', description: 'Delete boardroom blocks' },
  { name: 'bookings:read', description: 'View bookings' },
  { name: 'bookings:write', description: 'Create or update bookings' },
  { name: 'bookings:approve', description: 'Approve pending bookings' },
  { name: 'bookings:cancel', description: 'Cancel confirmed or pending bookings' },
  { name: 'bookings:delete', description: 'Permanently delete bookings' },
  { name: 'notifications:read', description: 'View notifications' },
  { name: 'notifications:write', description: 'Send or manage notifications' },
  { name: 'dashboard:read', description: 'View dashboards and analytics' },
  { name: 'audit-logs:read', description: 'View audit logs' },
  { name: 'settings:read', description: 'View system settings' },
  { name: 'settings:write', description: 'Update system settings' },
  { name: 'rooms:equipment', description: 'View and update room equipment status' },
];

const DEFAULT_ROLES: SeedRoleDefinition[] = [
  {
    name: 'SuperAdmin',
    description:
      'System owner with full access. Manages users, roles, permissions, system settings, and all operational modules.',
    permissions: DEFAULT_PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'Admin',
    description:
      'Business administrator for boardrooms and booking governance. Manages rooms, amenities, bookings, approvals, cancellations, settings, dashboards and audit logs.',
    permissions: [
      'boardrooms:read',
      'boardrooms:write',
      'boardrooms:delete',
      'amenities:read',
      'amenities:write',
      'amenities:delete',
      'boardroom-blocks:read',
      'boardroom-blocks:write',
      'boardroom-blocks:delete',
      'bookings:read',
      'bookings:write',
      'bookings:approve',
      'bookings:cancel',
      'bookings:delete',
      'notifications:read',
      'notifications:write',
      'dashboard:read',
      'audit-logs:read',
      'settings:read',
      'settings:write',
      'users:read',
      'roles:read',
    ],
  },
  {
    name: 'FacilitiesManager',
    description:
      'Operational user responsible for room readiness. Views all bookings, blocks rooms, manages room equipment status, and receives setup, catering and maintenance notifications.',
    permissions: [
      'boardrooms:read',
      'boardroom-blocks:read',
      'boardroom-blocks:write',
      'boardroom-blocks:delete',
      'bookings:read',
      'notifications:read',
      'notifications:write',
      'rooms:equipment',
      'dashboard:read',
    ],
  },
  {
    name: 'Employee',
    description: 'Standard employee — can browse boardrooms and manage their own bookings.',
    permissions: [
      'boardrooms:read',
      'amenities:read',
      'bookings:read',
      'bookings:write',
      'notifications:read',
    ],
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
    @InjectRepository(SystemSetting)
    private readonly systemSettingsRepository: Repository<SystemSetting>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Starting database seeding...');
    try {
      await this.seedPermissions();
      const roles = await this.seedRoles();
      await this.seedSuperAdmin(roles);
      await this.seedBookingRules();
      this.logger.log('Database seeding complete.');
    } catch (err) {
      this.logger.error('Database seeding failed');
      console.error(err);
    }
  }

  private async seedBookingRules(): Promise<void> {
    const defaults: Array<{ key: string; value: string; description: string }> = [
      {
        key: 'booking.operating_hours_start',
        value: '08:00',
        description: 'Earliest time a booking can start (HH:MM, 24h)',
      },
      {
        key: 'booking.operating_hours_end',
        value: '18:00',
        description: 'Latest time a booking can end (HH:MM, 24h)',
      },
      {
        key: 'booking.buffer_minutes',
        value: '15',
        description: 'Minimum minutes required between consecutive bookings in the same boardroom',
      },
      {
        key: 'booking.min_duration_minutes',
        value: '15',
        description: 'Minimum booking duration in minutes',
      },
      {
        key: 'booking.max_duration_minutes',
        value: '480',
        description: 'Maximum booking duration in minutes (480 = 8 hours)',
      },
    ];
    for (const def of defaults) {
      const existing = await this.systemSettingsRepository.findOne({ where: { key: def.key } });
      if (existing) {
        continue;
      }
      const setting = this.systemSettingsRepository.create({
        key: def.key,
        value: def.value,
        description: def.description,
      });
      await this.systemSettingsRepository.save(setting);
      this.logger.log(`Seeded system setting "${def.key}" = ${def.value}`);
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
          isSystemRole: true,
          permissions: desiredPermissions,
        });
        role = await this.rolesRepository.save(role);
        this.logger.log(`Seeded role "${def.name}"`);
      } else {
        const desiredSet = new Set(desiredPermissions.map((p) => p.name));
        const currentSet = new Set((role.permissions ?? []).map((p) => p.name));
        const added = desiredPermissions.filter((p) => !currentSet.has(p.name));
        const removed = (role.permissions ?? []).filter((p) => !desiredSet.has(p.name));
        const descriptionChanged = role.description !== def.description;
        const systemRoleChanged = !role.isSystemRole;

        if (added.length > 0 || removed.length > 0 || descriptionChanged || systemRoleChanged) {
          role.permissions = desiredPermissions;
          role.description = def.description;
          role.isSystemRole = true;
          role = await this.rolesRepository.save(role);
          this.logger.log(
            `Reconciled role "${def.name}" (+${added.length} / -${removed.length} permissions${descriptionChanged ? ', description updated' : ''})`,
          );
        }
      }
      result.set(def.name, role);
    }

    return result;
  }

  private async seedSuperAdmin(roles: Map<string, Role>): Promise<void> {
    const email = this.configService.getOrThrow<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.getOrThrow<string>('SUPER_ADMIN_PASSWORD');
    const firstName = this.configService.get<string>('SUPER_ADMIN_FIRST_NAME', 'Super');
    const lastName = this.configService.get<string>('SUPER_ADMIN_LAST_NAME', 'Admin');
    const superAdminRole = roles.get('SuperAdmin');
    if (!superAdminRole) {
      throw new Error('SuperAdmin role was not seeded');
    }

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      const changes: string[] = [];
      const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
      if (!passwordMatches) {
        existing.passwordHash = await bcrypt.hash(password, 10);
        changes.push('password');
      }
      if (existing.firstName !== firstName) {
        existing.firstName = firstName;
        changes.push('firstName');
      }
      if (existing.lastName !== lastName) {
        existing.lastName = lastName;
        changes.push('lastName');
      }
      if (existing.roleId !== superAdminRole.id) {
        existing.role = superAdminRole;
        changes.push('role');
      }
      if (!existing.isActive) {
        existing.isActive = true;
        changes.push('isActive');
      }
      if (changes.length > 0) {
        await this.usersRepository.save(existing);
        this.logger.log(
          `Reconciled Super Admin user ${email} from .env (${changes.join(', ')})`,
        );
      }
      return;
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
