import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

function reflector(values: Record<string, unknown>) {
  return {
    getAllAndOverride: (key: string) => values[key],
  };
}

function context(roles: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { profile: { roles } } }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const findMany = jest.fn();
  const prisma = { resourcePermission: { findMany } } as never;

  beforeEach(() => findMany.mockReset());

  it('allows a public route without reading permissions', async () => {
    const guard = new PermissionsGuard(
      reflector({ [IS_PUBLIC_KEY]: true }) as never,
      prisma,
    );
    await expect(
      guard.canActivate({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => {
          throw new Error('request should not be read');
        },
      } as unknown as ExecutionContext),
    ).resolves.toBe(true);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('allows a route that does not declare permissions', async () => {
    const guard = new PermissionsGuard(
      reflector({ [IS_PUBLIC_KEY]: false }) as never,
      prisma,
    );
    await expect(guard.canActivate(context(['ADMIN']))).resolves.toBe(true);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('loads every flag, including delete, and unions rows for the same resource', async () => {
    findMany.mockResolvedValue([
      {
        resourceName: 'Article',
        create: true,
        view: false,
        update: false,
        delete: false,
      },
      {
        resourceName: 'Article',
        create: false,
        view: false,
        update: false,
        delete: true,
      },
    ]);
    const guard = new PermissionsGuard(
      reflector({
        [IS_PUBLIC_KEY]: false,
        [PERMISSIONS_KEY]: [{ AND: ['Article.create', 'Article.delete'] }],
      }) as never,
      prisma,
    );

    await expect(guard.canActivate(context(['ADMIN', 'EDITOR']))).resolves.toBe(
      true,
    );
    expect(findMany.mock.calls[0][0].where.OR).toEqual([
      { view: true },
      { create: true },
      { update: true },
      { delete: true },
    ]);
    expect(findMany.mock.calls[0][0].where.role).toEqual({
      roleName: { in: ['ADMIN', 'EDITOR'] },
    });
  });

  it('denies the route when the loaded flags do not satisfy the expression', async () => {
    findMany.mockResolvedValue([
      {
        resourceName: 'Article',
        create: false,
        view: true,
        update: false,
        delete: false,
      },
    ]);
    const guard = new PermissionsGuard(
      reflector({
        [IS_PUBLIC_KEY]: false,
        [PERMISSIONS_KEY]: [{ AND: ['Article.create'] }],
      }) as never,
      prisma,
    );

    await expect(guard.canActivate(context(['ADMIN']))).resolves.toBe(false);
  });
});
