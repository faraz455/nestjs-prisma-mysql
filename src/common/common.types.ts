export type dumpyType = {};

export const EnvironmentVars = {
  JWT_SECRET: 'JWT_SECRET',
  LOG_QUERIES: 'LOG_QUERIES',
  LOG_REQUESTS: 'LOG_REQUESTS',
  AUTH_COOKIE_SECRET: 'AUTH_COOKIE_SECRET',
  DATABASE_URL: 'DATABASE_URL',
  TIMEZONE: 'TIMEZONE',
  PRODUCTION: 'PRODUCTION',
} as const;

export type EnvironmentVars = keyof typeof EnvironmentVars;

export const PermissionType = {
  create: 'create',
  view: 'view',
} as const;
export type PermissionType = keyof typeof PermissionType;
