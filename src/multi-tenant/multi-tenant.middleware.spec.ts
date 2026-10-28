import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { MultiTenantMiddleware } from './multi-tenant.middleware';

function config(
  tenants: Record<string, unknown> = { 'localhost:3000': { DB_NAME: 't' } },
) {
  return {
    get: () => tenants,
  } as unknown as ConfigService;
}

function run(middleware: MultiTenantMiddleware, req: Record<string, unknown>) {
  const next = jest.fn();
  return middleware.use(req as never, {} as never, next).then(() => next);
}

describe('MultiTenantMiddleware', () => {
  afterEach(() => {
    delete MultiTenantMiddleware.prismas['localhost:3000'];
    delete MultiTenantMiddleware.prismas['other.example:3000'];
  });

  it('does not resolve a tenant for the health check', async () => {
    const get = jest.fn();
    const middleware = new MultiTenantMiddleware({
      get,
    } as unknown as ConfigService);
    const next = await run(middleware, {
      originalUrl: '/health',
      headers: { host: 'missing.example' },
    });
    expect(next).toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects an unknown host before opening a pool', async () => {
    const middleware = new MultiTenantMiddleware(config());
    await expect(
      run(middleware, {
        originalUrl: '/articles',
        headers: { host: 'missing.example' },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(MultiTenantMiddleware.prismas['missing.example']).toBeUndefined();
  });

  it('reuses the pooled client, including the loopback host tests send', async () => {
    const pooled = { marker: true };
    MultiTenantMiddleware.prismas['localhost:3000'] = pooled as never;
    const middleware = new MultiTenantMiddleware(config());
    const next = await run(middleware, {
      originalUrl: '/articles',
      headers: { host: '127.0.0.1:4567' },
    });
    expect(next).toHaveBeenCalled();
    expect(MultiTenantMiddleware.prismas['localhost:3000']).toBe(pooled);
  });
});
