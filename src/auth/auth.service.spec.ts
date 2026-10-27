import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { User } from 'src/generated/prisma/client';
import { EnvironmentVars } from 'src/common/common.types';
import { AuthService } from './auth.service';
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
    getOrThrow: (key: string) => {
      if (key === EnvironmentVars.JWT_SECRET) {
        return JWT_SECRET;
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
});
