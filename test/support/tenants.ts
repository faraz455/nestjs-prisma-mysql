import { TenantConfig } from 'src/multi-tenant/multi-tenant.config';

export const LOCAL_HOST = 'localhost:3000';
export const OTHER_HOST = 'other.example:3000';
export const UNKNOWN_HOST = 'missing.example:3000';

const tenant = {
  AUTH_COOKIE_NAME: 'Authentication',
  REFRESH_COOKIE_NAME: 'Refresh',
  DB_HOST_MAIN: '127.0.0.1',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  DATA_STORAGE_ROOT: '/tmp/nestjs-prisma-mysql-test',
} satisfies TenantConfig;

export const TEST_TENANTS: Record<string, TenantConfig> = {
  [LOCAL_HOST]: tenant,
  [OTHER_HOST]: { ...tenant, DB_NAME: 'other' },
};
