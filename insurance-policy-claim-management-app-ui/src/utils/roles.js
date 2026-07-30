export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  INTERNAL_STAFF: 'ROLE_INTERNAL_STAFF',
  CUSTOMER: 'ROLE_CUSTOMER',
};

export const ROLE_HOME = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.INTERNAL_STAFF]: '/dashboard',
  [ROLES.CUSTOMER]: '/dashboard',
};