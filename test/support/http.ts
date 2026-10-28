import { INestApplication } from '@nestjs/common';
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

export async function loginAs(app: INestApplication, username: string) {
  const response = await http(app)
    .post('/auth/login')
    .send({ username, password: PASSWORD })
    .expect(200);
  return response.body as {
    authToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
    profile: { roles: string[]; username: string };
    permissions: { Article?: Record<string, boolean> };
  };
}

export function tokenPayload(token: string): Record<string, unknown> {
  const segment = token.split('.')[1];
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}
