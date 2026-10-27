import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVars } from 'src/common/common.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomJwtGuard } from './custom-jwt.guard';

const JWT_SECRET = 'test-jwt-secret';

function configService(): ConfigService {
  return {
    get: (key: string) => {
      if (key === 'multiTenant') {
        return {
          'localhost:3000': { AUTH_COOKIE_NAME: 'auth' },
        };
      }
      return undefined;
    },
    getOrThrow: (key: string) => {
      if (key === EnvironmentVars.JWT_SECRET) {
        return JWT_SECRET;
      }
      if (key === EnvironmentVars.AUTH_COOKIE_SECRET) {
        return 'test-cookie-secret';
      }
      throw new Error(`missing ${key}`);
    },
  } as unknown as ConfigService;
}

function contextFor(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function requestWith(token: string) {
  return {
    headers: {
      host: 'localhost:3000',
      authorization: `Bearer ${token}`,
    },
    originalUrl: '/articles',
    signedCookies: {},
    user: undefined as unknown,
  };
}

describe('CustomJwtGuard', () => {
  const reflector = {
    getAllAndOverride: () => false,
  } as unknown as Reflector;
  const jwtService = new JwtService({ secret: JWT_SECRET });

  function guardWith(prisma: Partial<PrismaService>) {
    return new CustomJwtGuard(
      reflector,
      configService(),
      prisma as PrismaService,
    );
  }

  function tokenWithRoles(roles: string[]) {
    return jwtService.sign({
      profile: {
        userId: 'user-1',
        username: 'ada',
        fullName: 'Ada',
        firstName: 'Ada',
        middleName: null,
        lastName: null,
        mobile: null,
        roles,
      },
    });
  }

  it('replaces token roles with the roles currently stored for the user', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      userRoles: [{ role: { roleName: 'ADMIN' } }],
    });
    const guard = guardWith({ user: { findUnique } } as never);
    const req = requestWith(tokenWithRoles(['SUPER ADMIN']));

    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);

    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: {
        userRoles: {
          select: { role: { select: { roleName: true } } },
        },
      },
    });
    expect(
      (req.user as { profile: { roles: string[] } }).profile.roles,
    ).toEqual(['ADMIN']);
  });

  it('rejects a token whose user no longer exists', async () => {
    const guard = guardWith({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    } as never);

    await expect(
      guard.canActivate(contextFor(requestWith(tokenWithRoles(['ADMIN'])))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
