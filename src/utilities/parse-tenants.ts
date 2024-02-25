const ConfigParser = require('configparser');
const execSync = require('child_process').execSync;
import * as process from 'process';
import { TenantConfig } from '../multi-tenant/multi-tenant.config';

export function applyMigrations() {
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

  for (const section in tenantConfigs) {
    const tConfig = tenantConfigs[section];
    process.env.DATABASE_URL = `mysql://${tConfig.DB_USER}:${tConfig.DB_PASSWORD}@${tConfig.DB_HOST_MAIN}/${tConfig.DB_NAME}?connection_limit=20`;

    console.log(`Running migrations for tenant ${section}`);

    let output;
    try {
      output = execSync(
        'npx prisma migrate resolve --applied 20221125082517_initial_migration',
        { encoding: 'utf-8' },
      ); // the default is 'buffer'
      console.log('Output was:\n', output);
    } catch (error) {
      console.log(error.output);
      console.log('Database already baselined. Continuing...');
    }
    output = execSync('npx prisma migrate deploy', { encoding: 'utf-8' }); // the default is 'buffer'
    console.log('Output was:\n', output);
  }
}
