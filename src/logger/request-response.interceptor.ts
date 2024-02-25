import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

import { Observable, tap } from 'rxjs';

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
    console.log(req.body);
    console.log('========================================');

    return next.handle().pipe(
      tap((responseBody) => {
        console.log('****************************************');
        console.log(responseBody);
        console.log('****************************************');
      }),
    );
  }
}
