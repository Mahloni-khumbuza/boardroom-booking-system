export enum PermissionName {
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',

  ROLES_READ = 'roles:read',
  ROLES_WRITE = 'roles:write',

  BOARDROOMS_READ = 'boardrooms:read',
  BOARDROOMS_WRITE = 'boardrooms:write',
  BOARDROOMS_DELETE = 'boardrooms:delete',

  AMENITIES_READ = 'amenities:read',
  AMENITIES_WRITE = 'amenities:write',
  AMENITIES_DELETE = 'amenities:delete',

  BOARDROOM_BLOCKS_READ = 'boardroom-blocks:read',
  BOARDROOM_BLOCKS_WRITE = 'boardroom-blocks:write',
  BOARDROOM_BLOCKS_DELETE = 'boardroom-blocks:delete',

  BOOKINGS_READ = 'bookings:read',
  BOOKINGS_WRITE = 'bookings:write',
  BOOKINGS_APPROVE = 'bookings:approve',
  BOOKINGS_CANCEL = 'bookings:cancel',
  BOOKINGS_DELETE = 'bookings:delete',

  NOTIFICATIONS_READ = 'notifications:read',
  NOTIFICATIONS_WRITE = 'notifications:write',

  DASHBOARD_READ = 'dashboard:read',

  AUDIT_LOGS_READ = 'audit-logs:read',

  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',

  ROOMS_EQUIPMENT = 'rooms:equipment',
}