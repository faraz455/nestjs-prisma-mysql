import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVars } from 'src/common/common.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { ACCESS_TOKEN_USE } from '../token-claims';
import { CustomJwtGuard } from './custom-jwt.guard';

const JWT_SECRET = 'test-jwt-secret';

function configService(): ConfigService {
  return {
    get: (key: string) => {
      if (key === 'multiTenant') {
        return {
          'localhost:3000': { AUTH_COOKIE_NAME: 'auth' },
          'other.example:3000': { AUTH_COOKIE_NAME: 'auth' },
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

function requestWith(token: string, host = 'localhost:3000') {
  return {
    headers: {
      host,
      authorization: `Bearer ${token}`,
    },
    originalUrl: '/articles',
    signedCookies: {},
    user: undefined as unknown,
  };
}

function activeSession(roleName = 'ADMIN') {
  return {
    userId: 'user-1',
    revoked: false,
    expiresAt: new Date(Date.now() + 60_000),
    user: { userRoles: [{ role: { roleName } }] },
  };
}

describe('CustomJwtGuard', () => {
  const reflector = {
    getAllAndOverride: () => false,
  } as unknown as Reflector;
  const jwtService = new JwtService({ secret: JWT_SECRET });

  function guardWith(findUnique: jest.Mock) {
    return new CustomJwtGuard(reflector, configService(), {
      userRefreshToken: { findUnique },
    } as unknown as PrismaService);
  }

  function accessToken(overrides: Record<string, unknown> = {}) {
    return jwtService.sign({
      sub: 'user-1',
      sid: 'session-1',
      tenant: 'localhost:3000',
      tokenUse: ACCESS_TOKEN_USE,
      profile: {
        userId: 'user-1',
        username: 'ada',
        fullName: 'Ada',
        firstName: 'Ada',
        middleName: null,
        lastName: null,
        mobile: null,
        roles: ['SUPER ADMIN'],
      },
      ...overrides,
    });
  }

  it('uses the roles on the active session for this tenant', async () => {
    const findUnique = jest.fn().mockResolvedValue(activeSession('ADMIN'));
    const guard = guardWith(findUnique);
    const req = requestWith(accessToken());

    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);

    expect(findUnique).toHaveBeenCalledWith({
      where: { userRefreshTokenId: 'session-1' },
      select: {
        userId: true,
        revoked: true,
        expiresAt: true,
        user: {
          select: {
            userRoles: {
              select: { role: { select: { roleName: true } } },
            },
          },
        },
      },
    });
    expect(
      (req.user as { profile: { roles: string[] } }).profile.roles,
    ).toEqual(['ADMIN']);
  });

  it('rejects a token issued for another tenant', async () => {
    const findUnique = jest.fn();
    const guard = guardWith(findUnique);

    await expect(
      guard.canActivate(
        contextFor(requestWith(accessToken(), 'other.example:3000')),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects a token whose session was revoked or removed', async () => {
    const guard = guardWith(jest.fn().mockResolvedValue(null));

    await expect(
      guard.canActivate(contextFor(requestWith(accessToken()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a revoked session', async () => {
    const guard = guardWith(
      jest.fn().mockResolvedValue({ ...activeSession(), revoked: true }),
    );

    await expect(
      guard.canActivate(contextFor(requestWith(accessToken()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('skips authentication on a public route', async () => {
    const findUnique = jest.fn();
    const guard = new CustomJwtGuard(
      { getAllAndOverride: () => true } as unknown as Reflector,
      configService(),
      { userRefreshToken: { findUnique } } as unknown as PrismaService,
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
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing token, a bad signature, a refresh token, and a mismatched profile', async () => {
    const findUnique = jest.fn();
    const guard = guardWith(findUnique);
    await expect(
      guard.canActivate(
        contextFor({
          headers: { host: 'localhost:3000' },
          originalUrl: '/articles',
          signedCookies: {},
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const forged = new JwtService({ secret: 'other-secret' }).sign({
      sub: 'user-1',
      sid: 'session-1',
      tenant: 'localhost:3000',
      tokenUse: ACCESS_TOKEN_USE,
    });
    await expect(
      guard.canActivate(contextFor(requestWith(forged))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      guard.canActivate(
        contextFor(requestWith(accessToken({ tokenUse: 'refresh' }))),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      guard.canActivate(
        contextFor(
          requestWith(
            accessToken({
              profile: {
                userId: 'someone-else',
                username: 'ada',
                fullName: 'Ada',
                firstName: 'Ada',
                middleName: null,
                lastName: null,
                mobile: null,
                roles: ['SUPER ADMIN'],
              },
            }),
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects an expired session and a session for a different user', async () => {
    await expect(
      guardWith(
        jest.fn().mockResolvedValue({
          ...activeSession(),
          expiresAt: new Date(Date.now() - 1000),
        }),
      ).canActivate(contextFor(requestWith(accessToken()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      guardWith(
        jest.fn().mockResolvedValue({ ...activeSession(), userId: 'other' }),
      ).canActivate(contextFor(requestWith(accessToken()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a raw authorization value and the signed auth cookie', async () => {
    const token = accessToken();
    const findUnique = jest.fn().mockResolvedValue(activeSession());
    const guard = guardWith(findUnique);
    const raw = {
      headers: { host: 'localhost:3000', authorization: token },
      originalUrl: '/articles',
      signedCookies: {},
    };
    await expect(guard.canActivate(contextFor(raw))).resolves.toBe(true);

    const cookieRequest = {
      headers: { host: 'localhost:3000' },
      originalUrl: '/articles',
      signedCookies: { auth: token },
    };
    await expect(guard.canActivate(contextFor(cookieRequest))).resolves.toBe(
      true,
    );
    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});
