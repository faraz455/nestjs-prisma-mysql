import { registerAs } from '@nestjs/config';
const ConfigParser = require('configparser');

export type TenantConfig = {
  SITE_CODE: string;
  BASE_URL: string;
  AUTH_COOKIE_NAME: string;
  DB_HOST_MAIN: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_DEBUG: boolean;
  DATA_STORAGE_ROOT: string;
};

export default registerAs('multiTenant', () => {
  let tenantConfigs: { [tenant: string]: TenantConfig } = {};
  const config = new ConfigParser();
  config.read('./env.conf');

  config.sections().forEach((section: string) => {
    tenantConfigs[section] = {
      SITE_CODE: config.get(section, 'SITE_CODE'),
      BASE_URL: config.get(section, 'BASE_URL'),
      AUTH_COOKIE_NAME: config.get(section, 'AUTH_COOKIE_NAME'),
      DB_HOST_MAIN: config.get(section, 'DB_HOST_MAIN'),
      DB_USER: config.get(section, 'DB_USER'),
      DB_PASSWORD: config.get(section, 'DB_PASSWORD'),
      DB_NAME: config.get(section, 'DB_NAME'),
      DB_DEBUG: config.get(section, 'DB_DEBUG') == '1',
      DATA_STORAGE_ROOT: config.get(section, 'DATA_STORAGE_ROOT'),
    };
  });
  return tenantConfigs;
});
