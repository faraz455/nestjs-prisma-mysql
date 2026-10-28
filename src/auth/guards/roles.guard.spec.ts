import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuards } from './roles.guard';

function reflector(values: Record<string, unknown>) {
  return { getAllAndOverride: (key: string) => values[key] };
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

describe('RolesGuards', () => {
  it('allows a public route without reading the user', () => {
    const guard = new RolesGuards(
      reflector({ [IS_PUBLIC_KEY]: true }) as never,
    );
    expect(
      guard.canActivate({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => {
          throw new Error('request should not be read');
        },
      } as unknown as ExecutionContext),
    ).toBe(true);
  });

  it('allows a route that does not declare roles', () => {
    const guard = new RolesGuards(
      reflector({ [IS_PUBLIC_KEY]: false }) as never,
    );
    expect(guard.canActivate(context(['EDITOR']))).toBe(true);
  });

  it('allows ADMIN or SUPER ADMIN and rejects any other role', () => {
    const guard = new RolesGuards(
      reflector({
        [IS_PUBLIC_KEY]: false,
        [ROLES_KEY]: [{ OR: ['ADMIN', 'SUPER ADMIN'] }],
      }) as never,
    );
    expect(guard.canActivate(context(['ADMIN']))).toBe(true);
    expect(guard.canActivate(context(['SUPER ADMIN']))).toBe(true);
    expect(guard.canActivate(context(['EDITOR']))).toBe(false);
    expect(guard.canActivate(context([]))).toBe(false);
  });

  it('requires every role in an AND group', () => {
    const guard = new RolesGuards(
      reflector({
        [IS_PUBLIC_KEY]: false,
        [ROLES_KEY]: [{ AND: ['ADMIN', 'SUPER ADMIN'] }],
      }) as never,
    );
    expect(guard.canActivate(context(['ADMIN']))).toBe(false);
    expect(guard.canActivate(context(['ADMIN', 'SUPER ADMIN']))).toBe(true);
  });
});
