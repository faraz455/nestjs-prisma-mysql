import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { MultiTenantMiddleware } from './multi-tenant/multi-tenant.middleware';
import { MultiTenantModule } from './multi-tenant/multi-tenant.module';
import multiTenantConfig from './multi-tenant/multi-tenant.config';
import { RequestResponseInterceptor } from './logger/request-response.interceptor';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CommonModule } from './common/common.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';

import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from './auth/guards/throttler-behind-proxy.guard';

@Module({
  imports: [
    CommonModule,
    ArticlesModule,
    MultiTenantModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [multiTenantConfig],
    }),
    AuthModule,
    ...getThrottlerModules(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestResponseInterceptor,
    },
    ...getThrottleGuards(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MultiTenantMiddleware).forRoutes('*');
  }
}

function getThrottlerModules(): DynamicModule[] {
  return process.env.PRODUCTION === '1'
    ? [
        ThrottlerModule.forRoot([
          {
            ttl: Number(process.env.THROTTLE_TTL) ?? 60000,
            limit: Number(process.env.THROTTLE_LIMIT) ?? 10,
          },
        ]),
      ]
    : [];
}

function getThrottleGuards() {
  return process.env.PRODUCTION === '1'
    ? [
        {
          provide: APP_GUARD,
          useClass: ThrottlerBehindProxyGuard,
        },
      ]
    : [];
}
