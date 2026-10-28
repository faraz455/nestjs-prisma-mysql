import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { Observable, tap } from 'rxjs';

const SECRET_KEYS = ['password', 'refreshToken', 'authToken', 'authorization'];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  const copy: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    copy[key] = SECRET_KEYS.includes(key) ? '[redacted]' : redact(inner);
  }
  return copy;
}

@Injectable()
export class RequestResponseInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (this.configService.get<number>('LOG_REQUESTS') == 0) {
      return next.handle();
    }

    const req: Request = context.switchToHttp().getRequest();
    console.log('========================================');
    console.log(`${req.headers.host}${req.url}`);
    console.log(redact(req.body));
    console.log('========================================');

    return next.handle().pipe(
      tap((responseBody) => {
        console.log('****************************************');
        console.log(redact(responseBody));
        console.log('****************************************');
      }),
    );
  }
}
