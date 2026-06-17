import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Amenity } from '../../modules/amenities/entities/amenity.entity';
import { Boardroom } from '../../modules/boardrooms/entities/boardroom.entity';
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
  { name: 'users:read',               description: 'View users' },
  { name: 'users:write',              description: 'Create or update users' },
  { name: 'users:delete',             description: 'Delete users' },
  { name: 'roles:read',               description: 'View roles' },
  { name: 'roles:write',              description: 'Create or update roles' },
  { name: 'boardrooms:read',          description: 'View boardrooms and check availability' },
  { name: 'boardrooms:write',         description: 'Create or update boardrooms' },
  { name: 'boardrooms:delete',        description: 'Delete boardrooms' },
  { name: 'amenities:read',           description: 'View amenities' },
  { name: 'amenities:write',          description: 'Create or update amenities' },
  { name: 'amenities:delete',         description: 'Delete amenities' },
  { name: 'boardroom-blocks:read',    description: 'View boardroom maintenance blocks' },
  { name: 'boardroom-blocks:write',   description: 'Create or update boardroom blocks' },
  { name: 'boardroom-blocks:delete',  description: 'Delete boardroom blocks' },
  { name: 'bookings:read',            description: 'View bookings' },
  { name: 'bookings:write',           description: 'Create or update bookings' },
  { name: 'bookings:approve',         description: 'Approve or reject pending bookings' },
  { name: 'bookings:cancel',          description: 'Cancel confirmed or pending bookings' },
  { name: 'bookings:delete',          description: 'Permanently delete cancelled/rejected bookings' },
  { name: 'notifications:read',       description: 'View notifications' },
  { name: 'notifications:write',      description: 'Send or manage notifications' },
  { name: 'dashboard:read',           description: 'View dashboards and analytics' },
  { name: 'audit-logs:read',          description: 'View audit logs' },
  { name: 'settings:read',            description: 'View system settings' },
  { name: 'settings:write',           description: 'Create, update or delete system settings' },
  { name: 'rooms:equipment',          description: 'Update boardroom equipment status' },
];

const DEFAULT_ROLES: SeedRoleDefinition[] = [
  {
    // Brief: System owner with full access. Manage users, roles, permissions, system settings, all modules.
    name: 'SuperAdmin',
    description: 'System owner with full access. Manages users, roles, permissions, system settings, and all operational modules.',
    permissions: DEFAULT_PERMISSIONS.map((p) => p.name),
  },
  {
    // Brief: Manage rooms, amenities, bookings, approvals, cancellations, settings, dashboards, audit logs.
    name: 'Admin',
    description: 'Business administrator for boardrooms and booking governance. Manages rooms, amenities, bookings, approvals, cancellations, settings, dashboards and audit logs.',
    permissions: [
      'boardrooms:read', 'boardrooms:write', 'boardrooms:delete',
      'amenities:read', 'amenities:write', 'amenities:delete',
      'boardroom-blocks:read', 'boardroom-blocks:write', 'boardroom-blocks:delete',
      'bookings:read', 'bookings:write', 'bookings:approve', 'bookings:cancel', 'bookings:delete',
      'notifications:read', 'notifications:write',
      'dashboard:read', 'audit-logs:read',
      'settings:read', 'settings:write',
      'users:read', 'roles:read',
    ],
  },
  {
    // Matrix: View/create/edit/cancel own bookings (Yes); View all bookings (Yes);
    //         Approve/reject (Configurable via FM_CAN_APPROVE_BOOKINGS setting);
    //         Cancel any booking (Yes); Manage boardrooms (Limited — equipment only);
    //         Manage users/roles (No); View audit logs (No); Manage settings (No).
    name: 'FacilitiesManager',
    description: 'Operational user responsible for room readiness. Manages room blocks, equipment status, booking approvals, and operational notifications.',
    permissions: [
      'boardrooms:read',
      'boardroom-blocks:read', 'boardroom-blocks:write', 'boardroom-blocks:delete',
      'rooms:equipment',
      'bookings:read', 'bookings:write', 'bookings:approve', 'bookings:cancel',
      'notifications:read', 'notifications:write',
      'dashboard:read',
    ],
  },
  {
    // Brief: View rooms; search availability; create, edit and cancel own bookings;
    //        view own booking history; receive notifications.
    name: 'Employee',
    description: 'Standard internal user. Can browse boardrooms, check availability, create and manage own bookings, and receive notifications.',
    permissions: [
      'boardrooms:read', 'amenities:read',
      'bookings:read', 'bookings:write', 'bookings:cancel',
      'notifications:read', 'dashboard:read',
    ],
  },
];

const DEFAULT_SYSTEM_SETTINGS: Array<{ key: string; value: string; description: string }> = [
  { key: 'BOOKING_REMINDER_MINUTES_BEFORE', value: '30',    description: 'Minutes before a booking starts to send a reminder email and notification.' },
  { key: 'DEFAULT_MINIMUM_BOOKING_MINUTES', value: '15',    description: 'Global minimum booking duration in minutes (overridden by room-level setting if higher).' },
  { key: 'DEFAULT_MAXIMUM_BOOKING_MINUTES', value: '480',   description: 'Global maximum booking duration in minutes (overridden by room-level setting if lower).' },
  { key: 'ALLOW_WEEKEND_BOOKINGS',          value: 'false', description: 'Allow bookings on Saturdays and Sundays.' },
  { key: 'ALLOW_AFTER_HOURS_BOOKINGS',      value: 'false', description: "Allow bookings outside a boardroom's configured opening and closing hours." },
  { key: 'EMAIL_REMINDERS_ENABLED',         value: 'true',  description: 'Send reminder emails before bookings start.' },
  { key: 'BOOKING_MAX_ADVANCE_DAYS',        value: '90',    description: 'Maximum number of days in advance a booking can be made.' },
  { key: 'BOOKING_CANCELLATION_POLICY',     value: '24',    description: 'Minimum hours notice required to cancel a booking without penalty.' },
  { key: 'CATERING_LEAD_TIME_HOURS',        value: '4',     description: 'Minimum hours notice required for catering requests.' },
  { key: 'FM_CAN_APPROVE_BOOKINGS',         value: 'true',  description: 'Allow Facilities Managers to approve and reject bookings (Configurable per permission matrix).' },
];

interface DemoAmenityDef { name: string; description: string; icon: string; }

const DEMO_AMENITIES: DemoAmenityDef[] = [
  { name: 'Projector',            description: 'HD projector with HDMI & wireless connectivity',              icon: '📽️' },
  { name: 'Video Conferencing',   description: 'Zoom/Teams-ready camera, speaker and display system',         icon: '📹' },
  { name: 'Whiteboard',           description: 'Large magnetic whiteboard with markers and eraser',           icon: '📋' },
  { name: 'TV Screen',            description: '75-inch 4K smart TV with screen mirroring',                  icon: '📺' },
  { name: 'Conference Phone',     description: 'Poly conference phone for crystal-clear audio calls',         icon: '📞' },
  { name: 'Wi-Fi',                description: 'Dedicated high-speed Wi-Fi access point (1 Gbps)',            icon: '📶' },
  { name: 'Catering Available',   description: 'In-room catering service — request when booking',             icon: '🍽️' },
  { name: 'Natural Light',        description: 'Large windows with natural lighting and blackout blinds',     icon: '☀️' },
  { name: 'Air Conditioning',     description: 'Climate-controlled environment with individual room control', icon: '❄️' },
  { name: 'Standing Desks',       description: 'Height-adjustable desks for flexible working postures',       icon: '🪑' },
  { name: 'Soundproof',           description: 'Acoustic panelling for confidential discussions',             icon: '🔇' },
];

interface DemoBoardroomDef {
  name: string; code: string; description: string; capacity: number;
  location: string; floor: string; building: string;
  requiresApproval: boolean; openingTime: string; closingTime: string;
  amenityNames: string[]; imageUrl?: string;
  minimumBookingMinutes?: number; maximumBookingMinutes?: number; bufferTimeAfterMinutes?: number;
}

const DEMO_BOARDROOMS: DemoBoardroomDef[] = [
  {
    name: 'Boardroom A — Executive Suite',
    code: 'BRA',
    description: 'Premium executive boardroom with panoramic city views, ideal for leadership meetings, investor presentations, and high-profile client engagements.',
    capacity: 20, location: 'Level 10, North Wing', floor: '10', building: 'Main Tower',
    requiresApproval: true, openingTime: '07:00', closingTime: '20:00',
    bufferTimeAfterMinutes: 15,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['Projector', 'Video Conferencing', 'Whiteboard', 'Conference Phone', 'Wi-Fi', 'Catering Available', 'Natural Light', 'Soundproof'],
  },
  {
    name: 'Boardroom B — Collaboration Hub',
    code: 'BRB',
    description: 'Mid-sized meeting room designed for team workshops, cross-department collaboration, and working sessions.',
    capacity: 12, location: 'Level 5, East Wing', floor: '5', building: 'Main Tower',
    requiresApproval: false, openingTime: '08:00', closingTime: '18:00',
    imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['TV Screen', 'Video Conferencing', 'Whiteboard', 'Wi-Fi', 'Conference Phone'],
  },
  {
    name: 'Boardroom C — Focus Room',
    code: 'BRC',
    description: 'Compact meeting space perfect for focused small-team discussions, one-on-ones, and quick syncs.',
    capacity: 6, location: 'Level 3, West Wing', floor: '3', building: 'Main Tower',
    requiresApproval: false, openingTime: '08:00', closingTime: '18:00',
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['TV Screen', 'Whiteboard', 'Wi-Fi', 'Soundproof'],
  },
  {
    name: 'Training Room',
    code: 'TRN',
    description: 'Large training facility with theatre-style seating and full AV setup, ideal for onboarding, workshops, and company-wide presentations.',
    capacity: 40, location: 'Level 2, South Wing', floor: '2', building: 'Annex Building',
    requiresApproval: true, openingTime: '07:30', closingTime: '19:00',
    minimumBookingMinutes: 60,
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['Projector', 'Whiteboard', 'Conference Phone', 'Wi-Fi', 'Catering Available'],
  },
  {
    name: 'Innovation Hub',
    code: 'IHB',
    description: 'Creative collaboration space with writable walls, modular furniture, and open brainstorming layout.',
    capacity: 15, location: 'Level 7, Central Atrium', floor: '7', building: 'Main Tower',
    requiresApproval: false, openingTime: '08:00', closingTime: '20:00',
    imageUrl: 'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['TV Screen', 'Video Conferencing', 'Whiteboard', 'Wi-Fi', 'Natural Light', 'Standing Desks'],
  },
  {
    name: 'Boardroom D — Interview Suite',
    code: 'BRD',
    description: 'Professional interview and assessment room with neutral décor and soundproofing for confidential conversations.',
    capacity: 4, location: 'Level 1, Reception', floor: '1', building: 'Main Tower',
    requiresApproval: false, openingTime: '08:00', closingTime: '17:30',
    imageUrl: 'https://images.unsplash.com/photo-1562516710-87d0b5b5c2c4?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['TV Screen', 'Wi-Fi', 'Soundproof'],
  },
  {
    name: 'Board Suite',
    code: 'BST',
    description: 'Premium boardroom reserved for board-level meetings, AGMs, and sensitive executive discussions.',
    capacity: 16, location: 'Level 15, Penthouse', floor: '15', building: 'Main Tower',
    requiresApproval: true, openingTime: '08:00', closingTime: '19:00',
    bufferTimeAfterMinutes: 30, minimumBookingMinutes: 60,
    imageUrl: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&auto=format&fit=crop&q=80',
    amenityNames: ['Projector', 'Video Conferencing', 'Whiteboard', 'Conference Phone', 'Wi-Fi', 'Catering Available', 'Natural Light', 'Soundproof'],
  },
];

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Permission) private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(Role)       private readonly rolesRepository: Repository<Role>,
    @InjectRepository(User)       private readonly usersRepository: Repository<User>,
    @InjectRepository(SystemSetting) private readonly systemSettingsRepository: Repository<SystemSetting>,
    @InjectRepository(Amenity)    private readonly amenitiesRepository: Repository<Amenity>,
    @InjectRepository(Boardroom)  private readonly boardroomsRepository: Repository<Boardroom>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.seedPermissions();
      const roles = await this.seedRoles();
      await this.seedSuperAdmin(roles);
      await this.seedSystemSettings();
      const amenities = await this.seedAmenities();
      await this.seedBoardrooms(amenities);
    } catch (err) {
      this.logger.error('Database seeding failed', err instanceof Error ? err.stack : String(err));
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
      let role = await this.rolesRepository.findOne({ where: { name: def.name }, relations: { permissions: true } });
      const desiredPermissions = def.permissions.map((n) => permissionsByName.get(n)).filter((p): p is Permission => Boolean(p));

      if (!role) {
        role = await this.rolesRepository.save(this.rolesRepository.create({ name: def.name, description: def.description, permissions: desiredPermissions }));
        this.logger.log(`Seeded role "${def.name}"`);
      } else {
        const desiredSet = new Set(desiredPermissions.map((p) => p.name));
        const currentSet = new Set((role.permissions ?? []).map((p) => p.name));
        const added = desiredPermissions.filter((p) => !currentSet.has(p.name));
        const removed = (role.permissions ?? []).filter((p) => !desiredSet.has(p.name));
        const descChanged = role.description !== def.description;
        if (added.length || removed.length || descChanged) {
          role.permissions = desiredPermissions;
          role.description = def.description;
          role = await this.rolesRepository.save(role);
          this.logger.log(`Reconciled role "${def.name}" (+${added.length}/-${removed.length} perms)`);
        }
      }
      result.set(def.name, role);
    }
    return result;
  }

  private async seedSuperAdmin(roles: Map<string, Role>): Promise<void> {
    const email     = this.configService.getOrThrow<string>('SUPER_ADMIN_EMAIL');
    const password  = this.configService.getOrThrow<string>('SUPER_ADMIN_PASSWORD');
    const firstName = this.configService.get<string>('SUPER_ADMIN_FIRST_NAME', 'Super');
    const lastName  = this.configService.get<string>('SUPER_ADMIN_LAST_NAME', 'Admin');
    const superAdminRole = roles.get('SuperAdmin');
    if (!superAdminRole) throw new Error('SuperAdmin role was not seeded');

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      const changes: string[] = [];
      if (!(await bcrypt.compare(password, existing.passwordHash))) { existing.passwordHash = await bcrypt.hash(password, 10); changes.push('password'); }
      if (existing.firstName !== firstName) { existing.firstName = firstName; changes.push('firstName'); }
      if (existing.lastName !== lastName)   { existing.lastName = lastName;   changes.push('lastName'); }
      if (existing.roleId !== superAdminRole.id) { existing.role = superAdminRole; changes.push('role'); }
      if (!existing.isActive) { existing.isActive = true; changes.push('isActive'); }
      if (changes.length) { await this.usersRepository.save(existing); this.logger.log(`Reconciled SuperAdmin ${email} (${changes.join(', ')})`); }
      return;
    }
    await this.usersRepository.save(this.usersRepository.create({ email, passwordHash: await bcrypt.hash(password, 10), firstName, lastName, isActive: true, role: superAdminRole }));
    this.logger.log(`Seeded initial SuperAdmin user: ${email}`);
  }

  private async seedSystemSettings(): Promise<void> {
    const existing = await this.systemSettingsRepository.find();
    const existingKeys = new Set(existing.map((s) => s.key));
    const toCreate = DEFAULT_SYSTEM_SETTINGS.filter((s) => !existingKeys.has(s.key));
    if (toCreate.length > 0) {
      await this.systemSettingsRepository.save(toCreate.map((s) => this.systemSettingsRepository.create(s)));
      this.logger.log(`Seeded ${toCreate.length} default system settings`);
    }
  }

  private async seedAmenities(): Promise<Map<string, Amenity>> {
    const result = new Map<string, Amenity>();
    for (const def of DEMO_AMENITIES) {
      let amenity = await this.amenitiesRepository.findOne({ where: { name: def.name } });
      if (!amenity) {
        amenity = await this.amenitiesRepository.save(this.amenitiesRepository.create(def));
        this.logger.log(`Seeded amenity: ${def.name}`);
      }
      result.set(def.name, amenity);
    }
    return result;
  }

  private async seedBoardrooms(amenities: Map<string, Amenity>): Promise<Map<string, Boardroom>> {
    const result = new Map<string, Boardroom>();
    for (const def of DEMO_BOARDROOMS) {
      let boardroom = await this.boardroomsRepository.findOne({ where: { code: def.code } });
      if (!boardroom) {
        const roomAmenities = def.amenityNames.map((n) => amenities.get(n)).filter((a): a is Amenity => Boolean(a));
        boardroom = await this.boardroomsRepository.save(this.boardroomsRepository.create({
          name: def.name, code: def.code, description: def.description,
          capacity: def.capacity, location: def.location, floor: def.floor, building: def.building,
          requiresApproval: def.requiresApproval, openingTime: def.openingTime, closingTime: def.closingTime,
          imageUrl: def.imageUrl ?? null, isActive: true, isBookable: true,
          minimumBookingMinutes: def.minimumBookingMinutes ?? 15,
          maximumBookingMinutes: def.maximumBookingMinutes ?? 480,
          bufferTimeAfterMinutes: def.bufferTimeAfterMinutes ?? 0,
          amenities: roomAmenities,
        }));
        this.logger.log(`Seeded boardroom: ${def.name}`);
      } else if (!boardroom.imageUrl && def.imageUrl) {
        boardroom.imageUrl = def.imageUrl;
        await this.boardroomsRepository.save(boardroom);
      }
      result.set(def.code, boardroom);
    }
    return result;
  }

}
