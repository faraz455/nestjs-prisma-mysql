import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { User } from 'src/generated/prisma/client';
import { EnvironmentVars } from 'src/common/common.types';
import { AuthService } from './auth.service';
import { SignupDto } from './dto';
import { REFRESH_TOKEN_USE } from './token-claims';

const JWT_SECRET = 'test-jwt-secret';

function user(): User {
  return {
    userId: 'ADMIN',
    username: 'admin',
    password: 'hashed-password',
    firstName: 'Admin',
    middleName: null,
    lastName: null,
    fullName: 'Admin',
    gender: 'MALE',
    birthDateString: '-',
    email: null,
    mobile: null,
    address: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
}

describe('AuthService sessions', () => {
  const jwtService = new JwtService({
    secret: JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  });
  const configService = {
    get: (key: string) => {
      if (key === 'multiTenant') {
        return {
          'localhost:3000': {
            AUTH_COOKIE_NAME: 'Authentication',
            REFRESH_COOKIE_NAME: 'Refresh',
          },
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

  function serviceWith(prisma: Record<string, unknown>) {
    return new AuthService(prisma as never, jwtService, configService);
  }

  function prismaForLogin() {
    const created: { refreshToken: string; userRefreshTokenId: string }[] = [];
    const prisma: {
      userRole: { findMany: jest.Mock };
      user: { findUniqueOrThrow: jest.Mock };
      userRefreshToken: {
        create: jest.Mock;
        findUnique: jest.Mock;
        updateMany: jest.Mock;
      };
      $transaction: jest.Mock;
    } = {
      userRole: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ role: { roleName: 'ADMIN' } }]),
      },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ userRoles: [] }),
      },
      userRefreshToken: {
        create: jest.fn().mockImplementation(({ data }) => {
          created.push(data);
          return data;
        }),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    return { prisma, created };
  }

  it('binds the access token to the tenant and stores a hash of the refresh token', async () => {
    const { prisma, created } = prismaForLogin();
    const result = await serviceWith(prisma).login(user(), 'localhost:3000');
    const claims = jwtService.decode(result.authToken) as {
      tenant: string;
      sid: string;
      tokenUse: string;
      user?: unknown;
    };

    expect(claims.tenant).toBe('localhost:3000');
    expect(claims.sid).toBe(created[0].userRefreshTokenId);
    expect(claims.tokenUse).toBe('access');
    expect(claims.user).toBeUndefined();
    expect(result.user).not.toHaveProperty('password');
    expect(created[0].refreshToken).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(created[0].refreshToken).not.toBe(result.refreshToken);
  });

  it('rejects a refresh token presented to another tenant', async () => {
    const { prisma } = prismaForLogin();
    const service = serviceWith(prisma);
    const issued = await service.login(user(), 'localhost:3000');

    await expect(
      service.refreshToken(issued.refreshToken, 'other.example:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.userRefreshToken.findUnique).not.toHaveBeenCalled();
  });

  it('revokes every session when a revoked refresh token is presented again', async () => {
    const { prisma, created } = prismaForLogin();
    const service = serviceWith(prisma);
    const issued = await service.login(user(), 'localhost:3000');
    prisma.userRefreshToken.findUnique.mockResolvedValue({
      userRefreshTokenId: created[0].userRefreshTokenId,
      userId: 'ADMIN',
      refreshToken: created[0].refreshToken,
      revoked: true,
      expiresAt: new Date(Date.now() + 60_000),
      user: user(),
    });

    await expect(
      service.refreshToken(issued.refreshToken, 'localhost:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.userRefreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'ADMIN', revoked: false },
      data: { revoked: true },
    });
  });

  it('signs refresh tokens as refresh credentials', async () => {
    const { prisma } = prismaForLogin();
    const issued = await serviceWith(prisma).login(user(), 'localhost:3000');
    const claims = jwtService.decode(issued.refreshToken) as {
      tokenUse: string;
      tenant: string;
    };

    expect(claims.tokenUse).toBe(REFRESH_TOKEN_USE);
    expect(claims.tenant).toBe('localhost:3000');
  });

  it('rotates a live refresh token and rejects a token that lost the race', async () => {
    const { prisma, created } = prismaForLogin();
    const service = serviceWith(prisma);
    const issued = await service.login(user(), 'localhost:3000');
    prisma.userRefreshToken.findUnique.mockResolvedValue({
      userRefreshTokenId: created[0].userRefreshTokenId,
      userId: 'ADMIN',
      refreshToken: created[0].refreshToken,
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: user(),
    });

    const next = await service.refreshToken(
      issued.refreshToken,
      'localhost:3000',
    );
    expect(next.refreshToken).not.toBe(issued.refreshToken);
    expect(next.authToken).not.toBe(issued.authToken);

    prisma.userRefreshToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.refreshToken(issued.refreshToken, 'localhost:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired, mismatched, forged, or access token used as a refresh token', async () => {
    const { prisma, created } = prismaForLogin();
    const service = serviceWith(prisma);
    const issued = await service.login(user(), 'localhost:3000');
    prisma.userRefreshToken.updateMany.mockClear();

    prisma.userRefreshToken.findUnique.mockResolvedValue({
      userRefreshTokenId: created[0].userRefreshTokenId,
      userId: 'ADMIN',
      refreshToken: created[0].refreshToken,
      revoked: false,
      expiresAt: new Date(Date.now() - 1000),
      user: user(),
    });
    await expect(
      service.refreshToken(issued.refreshToken, 'localhost:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.userRefreshToken.findUnique.mockResolvedValue({
      userRefreshTokenId: created[0].userRefreshTokenId,
      userId: 'ADMIN',
      refreshToken: 'not-the-hash',
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: user(),
    });
    await expect(
      service.refreshToken(issued.refreshToken, 'localhost:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.userRefreshToken.updateMany).not.toHaveBeenCalled();

    await expect(
      service.refreshToken('not-a-token', 'localhost:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.refreshToken(issued.authToken, 'localhost:3000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.userRefreshToken.findUnique).toHaveBeenCalledTimes(2);
  });

  it('unions permission flags from every role and drops an all-false row', async () => {
    const { prisma } = prismaForLogin();
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      userRoles: [
        {
          role: {
            resourcePermissions: [
              {
                resourceName: 'Article',
                create: false,
                view: false,
                update: false,
                delete: false,
              },
            ],
          },
        },
        {
          role: {
            resourcePermissions: [
              {
                resourceName: 'Article',
                create: true,
                view: false,
                update: false,
                delete: false,
              },
            ],
          },
        },
        {
          role: {
            resourcePermissions: [
              {
                resourceName: 'Article',
                create: false,
                view: true,
                update: false,
                delete: true,
              },
            ],
          },
        },
      ],
    });

    const result = await serviceWith(prisma).login(user(), 'localhost:3000');
    expect(result.permissions.Article).toEqual({
      create: true,
      view: true,
      update: false,
      delete: true,
    });
    expect(
      prisma.user.findUniqueOrThrow.mock.calls[0][0].select.userRoles.select
        .role.select.resourcePermissions.select,
    ).toEqual({
      resourceName: true,
      create: true,
      view: true,
      update: true,
      delete: true,
    });
  });

  it('revokes the presented access token and ignores one from another tenant', async () => {
    const { prisma, created } = prismaForLogin();
    const service = serviceWith(prisma);
    const issued = await service.login(user(), 'localhost:3000');
    prisma.userRefreshToken.updateMany.mockClear();

    await service.logout({
      headers: {
        host: 'other.example:3000',
        authorization: `Bearer ${issued.authToken}`,
      },
      originalUrl: '/auth/logout',
      signedCookies: {},
    } as unknown as Request);
    expect(prisma.userRefreshToken.updateMany).not.toHaveBeenCalled();

    await service.logout({
      headers: {
        host: 'localhost:3000',
        authorization: `Bearer ${issued.authToken}`,
      },
      originalUrl: '/auth/logout',
      signedCookies: { Refresh: issued.refreshToken },
    } as unknown as Request);
    expect(prisma.userRefreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userRefreshTokenId: created[0].userRefreshTokenId,
        userId: 'ADMIN',
        revoked: false,
      },
      data: { revoked: true },
    });
  });

  it('revokes every session for an existing user and still requires the user row', async () => {
    const { prisma } = prismaForLogin();
    const service = serviceWith(prisma);
    prisma.user.findUniqueOrThrow.mockRejectedValueOnce(new Error('missing'));
    await expect(service.revokeUserSessionsByAdmin('missing')).rejects.toThrow(
      'missing',
    );

    prisma.user.findUniqueOrThrow.mockResolvedValue({ userId: 'ADMIN' });
    prisma.userRefreshToken.updateMany.mockResolvedValue({ count: 2 });
    await expect(service.revokeUserSessionsByAdmin('ADMIN')).resolves.toEqual({
      userId: 'ADMIN',
      revoked: 2,
    });
  });

  it('rejects a malformed or wrong password and strips the hash on success', async () => {
    const findFirst = jest.fn();
    const service = serviceWith({ user: { findFirst } });
    await expect(
      service.validateUser({ body: { username: 'admin' } } as Request),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findFirst).not.toHaveBeenCalled();

    findFirst.mockResolvedValue(null);
    await expect(
      service.validateUser({
        body: { username: 'admin', password: 'secret' },
      } as Request),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const hash = await bcrypt.hash('secret', 4);
    findFirst.mockResolvedValue({ ...user(), password: hash });
    await expect(
      service.validateUser({
        body: { username: 'admin', password: 'nope' },
      } as Request),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const result = await service.validateUser({
      body: { username: 'admin', password: 'secret' },
    } as Request);
    expect(result).not.toHaveProperty('password');
    expect(result.username).toBe('admin');
  });

  it('stores a bcrypt password and omits blank name parts', async () => {
    const create = jest.fn(async ({ data }) => ({ userId: data.userId }));
    const service = serviceWith({ user: { create } });
    const created = await service.signup({
      username: 'ada',
      password: 'secret',
      firstName: 'Ada',
      lastName: 'Lovelace',
      middleName: 'Marie',
      gender: 'MALE',
      birthDateString: '-',
      email: 'ada@example.com',
    } as SignupDto);

    const data = create.mock.calls[0][0].data;
    expect(data.fullName).toBe('Ada Marie Lovelace');
    expect(data.password).not.toBe('secret');
    await expect(bcrypt.compare('secret', data.password)).resolves.toBe(true);
    expect(created).toEqual({ id: data.userId });

    await service.signup({
      username: 'ada',
      password: 'secret',
      firstName: 'Ada',
      gender: 'MALE',
      birthDateString: '-',
      email: 'ada@example.com',
    } as SignupDto);
    expect(create.mock.calls[1][0].data.fullName).toBe('Ada');
  });
});
