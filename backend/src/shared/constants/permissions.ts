export const Permission = {
  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Roles
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',

  // Boardrooms
  BOARDROOMS_READ: 'boardrooms:read',
  BOARDROOMS_WRITE: 'boardrooms:write',
  BOARDROOMS_DELETE: 'boardrooms:delete',

  // Amenities
  AMENITIES_READ: 'amenities:read',
  AMENITIES_WRITE: 'amenities:write',
  AMENITIES_DELETE: 'amenities:delete',

  // Boardroom blocks
  BOARDROOM_BLOCKS_READ: 'boardroom-blocks:read',
  BOARDROOM_BLOCKS_WRITE: 'boardroom-blocks:write',
  BOARDROOM_BLOCKS_DELETE: 'boardroom-blocks:delete',

  // Bookings
  BOOKINGS_READ: 'bookings:read',
  BOOKINGS_WRITE: 'bookings:write',
  BOOKINGS_APPROVE: 'bookings:approve',
  BOOKINGS_CANCEL: 'bookings:cancel',
  BOOKINGS_DELETE: 'bookings:delete',

  // Notifications
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_WRITE: 'notifications:write',

  // Dashboard & reports
  DASHBOARD_READ: 'dashboard:read',

  // Audit logs
  AUDIT_LOGS_READ: 'audit-logs:read',

  // System settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Equipment
  ROOMS_EQUIPMENT: 'rooms:equipment',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];
