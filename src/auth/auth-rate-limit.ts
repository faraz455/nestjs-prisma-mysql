import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

export const AUTH_ATTEMPT_LIMIT = 10;
export const AUTH_ATTEMPT_WINDOW_MS = 60_000;

const TOO_MANY_ATTEMPTS = 'Too many attempts. Try again later.';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size <= 1000) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function consumeAuthAttempt(key: string, now = Date.now()): void {
  sweep(now);
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + AUTH_ATTEMPT_WINDOW_MS });
    return;
  }
  current.count += 1;
  if (current.count > AUTH_ATTEMPT_LIMIT) {
    throw new HttpException(TOO_MANY_ATTEMPTS, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export function resetAuthRateLimit(): void {
  buckets.clear();
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const address = req.ip || req.socket?.remoteAddress || 'unknown';
    consumeAuthAttempt(`${req.method} ${req.path} ${address}`);
    return true;
  }
}
