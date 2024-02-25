import { Global, Module, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { TenantConfig } from './multi-tenant.config';
import { MultiTenantMiddleware } from './multi-tenant.middleware';
import { getHost } from '../common/common.helper';

export const PRISMA_SERVICE = 'PRISMA_SERVICE';
export const TENANT_CONFIG = 'TENANT_CONFIG';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PRISMA_SERVICE,
      inject: [REQUEST],
      scope: Scope.REQUEST,
      useFactory: (req: Request) => {
        // check 127.0.0.1 to support tests
        const host: string = getHost(req);

        return MultiTenantMiddleware.prismas[host];
      },
    },
    {
      provide: TENANT_CONFIG,
      inject: [REQUEST, ConfigService],
      scope: Scope.REQUEST,
      useFactory: (req: Request, configService: ConfigService) => {
        const tConfig: TenantConfig =
          configService.get('multiTenant')[getHost(req)];
        return tConfig;
      },
    },
  ],
  exports: [PRISMA_SERVICE, TENANT_CONFIG],
})
export class MultiTenantModule {}
