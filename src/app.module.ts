import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CommonModule } from './common/common.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MultiTenantMiddleware } from './multi-tenant/multi-tenant.middleware';
import { MultiTenantModule } from './multi-tenant/multi-tenant.module';
import multiTenantConfig from './multi-tenant/multi-tenant.config';
import { RequestResponseInterceptor } from './logger/request-response.interceptor';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { EnvironmentVars } from './common/common.types';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MultiTenantMiddleware).forRoutes('*');
  }
}
