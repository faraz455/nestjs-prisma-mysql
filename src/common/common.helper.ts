import { Request } from 'express';

const fs = require('fs');

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

export function getHost(req: Request) {
  let host: string = req.headers.host!;
  if (req.originalUrl.includes('private/api')) {
    // @ts-ignore
    host = req.headers['header-host'];
    if (!host) {
      return 'impossiblestring';
    }
  }
}
