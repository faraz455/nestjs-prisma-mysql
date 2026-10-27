import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

import { TenantConfig } from './multi-tenant.config';
import { getHost } from '../common/common.helper';

type TenantPrismaMapping = {
  [key: string]: PrismaService;
};

@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  static prismas: TenantPrismaMapping = {};
  constructor(private configService: ConfigService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl !== '/health') {
      // check 127.0.0.1 to support tests
      const host: string = getHost(req);

      if (!MultiTenantMiddleware.prismas[host]) {
        const tConfig: TenantConfig =
          this.configService.get('multiTenant')[host];

        if (!tConfig) {
          throw new NotFoundException('Tenant not found');
        }

        MultiTenantMiddleware.prismas[host] = new PrismaService({
          logQueries: this.configService.get<number>('LOG_QUERIES') == 1,
          host: tConfig.DB_HOST_MAIN,
          user: tConfig.DB_USER,
          password: tConfig.DB_PASSWORD,
          database: tConfig.DB_NAME,
        });
        await MultiTenantMiddleware.prismas[host].initService();
        console.log('New connection pool to database made for', host);
      }
    }
    next();
  }
}
