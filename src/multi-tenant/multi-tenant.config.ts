import { registerAs } from '@nestjs/config';
const ConfigParser = require('configparser');

export type TenantConfig = {
  AUTH_COOKIE_NAME: string;
  REFRESH_COOKIE_NAME: string;
  DB_HOST_MAIN: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DATA_STORAGE_ROOT: string;
};

export default registerAs('multiTenant', () => {
  let tenantConfigs: { [tenant: string]: TenantConfig } = {};
  const config = new ConfigParser();
  config.read('./env.conf');

  config.sections().forEach((section: string) => {
    tenantConfigs[section] = {
      AUTH_COOKIE_NAME: config.get(section, 'AUTH_COOKIE_NAME'),
      REFRESH_COOKIE_NAME: config.get(section, 'REFRESH_COOKIE_NAME'),
      DB_HOST_MAIN: config.get(section, 'DB_HOST_MAIN'),
      DB_USER: config.get(section, 'DB_USER'),
      DB_PASSWORD: config.get(section, 'DB_PASSWORD'),
      DB_NAME: config.get(section, 'DB_NAME'),
      DATA_STORAGE_ROOT: config.get(section, 'DATA_STORAGE_ROOT'),
    };
  });
  return tenantConfigs;
});
