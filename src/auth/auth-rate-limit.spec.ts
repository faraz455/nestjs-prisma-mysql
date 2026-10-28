import { ExecutionContext, HttpException } from '@nestjs/common';
import { Request } from 'express';
import {
  AUTH_ATTEMPT_LIMIT,
  AUTH_ATTEMPT_WINDOW_MS,
  AuthRateLimitGuard,
  consumeAuthAttempt,
  resetAuthRateLimit,
} from './auth-rate-limit';

function context(path: string, address = '203.0.113.4'): ExecutionContext {
  const req = {
    method: 'POST',
    path,
    ip: address,
  } as Request;
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

describe('auth attempt limit', () => {
  beforeEach(() => {
    resetAuthRateLimit();
  });

  it('allows the cap inside one window and a new window after it', () => {
    for (let attempt = 0; attempt < AUTH_ATTEMPT_LIMIT; attempt += 1) {
      consumeAuthAttempt('POST /auth/login 203.0.113.4', 1_000);
    }
    expect(() =>
      consumeAuthAttempt('POST /auth/login 203.0.113.4', 1_000),
    ).toThrow(HttpException);
    expect(() =>
      consumeAuthAttempt('POST /auth/signup 203.0.113.4', 1_000),
    ).not.toThrow();
    expect(() =>
      consumeAuthAttempt(
        'POST /auth/login 203.0.113.4',
        1_000 + AUTH_ATTEMPT_WINDOW_MS,
      ),
    ).not.toThrow();
  });

  it('limits each route and address on the guard', () => {
    const guard = new AuthRateLimitGuard();
    for (let attempt = 0; attempt < AUTH_ATTEMPT_LIMIT; attempt += 1) {
      expect(guard.canActivate(context('/auth/login'))).toBe(true);
    }
    expect(() => guard.canActivate(context('/auth/login'))).toThrow(
      HttpException,
    );
    expect(guard.canActivate(context('/auth/login', '203.0.113.5'))).toBe(true);
    expect(guard.canActivate(context('/auth/refresh-token'))).toBe(true);
  });
});
