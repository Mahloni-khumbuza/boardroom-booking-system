export const PERMISSIONS = {
  BOOKINGS: {
    READ: 'bookings:read',
    WRITE: 'bookings:write',
    APPROVE: 'bookings:approve',
    CANCEL: 'bookings:cancel',
    DELETE: 'bookings:delete',
  },

  BOARDROOMS: {
    READ: 'boardrooms:read',
    WRITE: 'boardrooms:write',
    DELETE: 'boardrooms:delete',
  },

  AMENITIES: {
    READ: 'amenities:read',
    WRITE: 'amenities:write',
    DELETE: 'amenities:delete',
  },

  USERS: {
    READ: 'users:read',
    WRITE: 'users:write',
    DELETE: 'users:delete',
  },

  ROLES: {
    READ: 'roles:read',
    WRITE: 'roles:write',
    DELETE: 'roles:delete',
  },
} as const;