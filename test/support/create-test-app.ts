import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { applyHttpDefaults } from 'src/bootstrap/apply-http-defaults';
import multiTenantConfig from 'src/multi-tenant/multi-tenant.config';
import { MultiTenantMiddleware } from 'src/multi-tenant/multi-tenant.middleware';
import { PrismaService } from 'src/prisma/prisma.service';
import { createMemoryPrisma, MemoryPrisma } from './memory-prisma';
import { seedTenant } from './seed';
import { LOCAL_HOST, OTHER_HOST, TEST_TENANTS } from './tenants';

export type TestApp = {
  app: INestApplication;
  prisma: MemoryPrisma;
  otherPrisma: MemoryPrisma;
  initService: jest.SpyInstance;
};

export async function createTestApp(): Promise<TestApp> {
  if (!process.env.JWT_SECRET || !process.env.AUTH_COOKIE_SECRET) {
    throw new Error('HTTP tests require the secrets from test/setup-env.ts');
  }

  const prisma = createMemoryPrisma();
  const otherPrisma = createMemoryPrisma();
  seedTenant(prisma);
  MultiTenantMiddleware.prismas[LOCAL_HOST] = prisma as never;
  MultiTenantMiddleware.prismas[OTHER_HOST] = otherPrisma as never;

  const initService = jest
    .spyOn(PrismaService.prototype, 'initService')
    .mockRejectedValue(new Error('HTTP tests must not open a database pool'));

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(multiTenantConfig.KEY)
    .useValue(TEST_TENANTS)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  applyHttpDefaults(app);
  await app.init();
  return { app, prisma, otherPrisma, initService };
}

export async function closeTestApp(context: TestApp): Promise<void> {
  await context.app.close();
  const pools = Object.values(MultiTenantMiddleware.prismas);
  for (const host of Object.keys(MultiTenantMiddleware.prismas)) {
    delete MultiTenantMiddleware.prismas[host];
  }
  for (const pool of pools) {
    const disconnect = (pool as { $disconnect?: () => Promise<void> })
      .$disconnect;
    if (typeof disconnect === 'function') {
      await disconnect.call(pool).catch((): undefined => undefined);
    }
  }
  const opened = context.initService.mock.calls.length;
  context.initService.mockRestore();
  if (opened > 0) {
    throw new Error('HTTP tests must not open a database pool');
  }
}
