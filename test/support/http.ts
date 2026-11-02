import { createHmac } from 'crypto';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PASSWORD } from './seed';

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

export function http(app: INestApplication) {
  return request(app.getHttpServer());
}

export function call(
  app: INestApplication,
  method: HttpMethod,
  url: string,
  token?: string,
) {
  const pending = http(app)[method](url);
  return token ? pending.set('Authorization', `Bearer ${token}`) : pending;
}

export function errorText(body: { message?: string | string[] }): string {
  if (Array.isArray(body.message)) {
    return body.message.join(' ');
  }
  return body.message ?? '';
}

export function cookieHeader(res: {
  headers: Record<string, unknown>;
}): string {
  const raw = res.headers['set-cookie'];
  if (Array.isArray(raw)) {
    return raw.join('\n');
  }
  return typeof raw === 'string' ? raw : '';
}

function setCookieLines(res: { headers: Record<string, unknown> }): string[] {
  const raw = res.headers['set-cookie'];
  if (Array.isArray(raw)) {
    return raw.map(String);
  }
  return typeof raw === 'string' ? [raw] : [];
}

export function cookiePair(
  res: { headers: Record<string, unknown> },
  name: string,
): string {
  const line = setCookieLines(res).find((entry) =>
    entry.startsWith(`${name}=`),
  );
  if (!line) {
    throw new Error(`missing ${name} cookie`);
  }
  return line.split(';')[0];
}

export function unsignedCookie(
  res: { headers: Record<string, unknown> },
  name: string,
): string {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) {
    throw new Error('AUTH_COOKIE_SECRET is required to read a test cookie');
  }
  const encoded = cookiePair(res, name).slice(name.length + 1);
  const value = cookieParser.signedCookie(decodeURIComponent(encoded), secret);
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} cookie signature was rejected`);
  }
  return value;
}

export function refreshCookieHeader(value: string): string {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) {
    throw new Error('AUTH_COOKIE_SECRET is required to sign a test cookie');
  }
  const signature = createHmac('sha256', secret)
    .update(value)
    .digest('base64')
    .replace(/=+$/, '');
  return `Refresh=${encodeURIComponent(`s:${value}.${signature}`)}`;
}

export async function loginAs(app: INestApplication, username: string) {
  const response = await http(app)
    .post('/auth/login')
    .send({ username, password: PASSWORD })
    .expect(200);
  return {
    ...(response.body as {
      authToken: string;
      user: Record<string, unknown>;
      profile: { roles: string[]; username: string };
      permissions: { Article?: Record<string, boolean> };
    }),
    refreshToken: unsignedCookie(response, 'Refresh'),
    authCookie: cookiePair(response, 'Authentication'),
    refreshCookie: cookiePair(response, 'Refresh'),
  };
}

export function tokenPayload(token: string): Record<string, unknown> {
  const segment = token.split('.')[1];
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}
