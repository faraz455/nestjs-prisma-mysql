import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '../generated/prisma/client';
import { ConfigService } from '@nestjs/config';

import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import cookieParser from 'cookie-parser';

import { PRISMA_SERVICE } from '../multi-tenant/multi-tenant.module';
import { TenantConfig } from '../multi-tenant/multi-tenant.config';

import { getHost, MakeTimedIDUnique } from 'src/common/common.helper';
import { EnvironmentVars } from 'src/common/common.types';
import { IDDto } from 'src/common/dto';
import { Profile, ResoucePermissionType, ResourceName, SignupDto } from './dto';
import { RevokedSessionsEntity } from './entities';
import {
  ACCESS_TOKEN_USE,
  REFRESH_TOKEN_USE,
  RefreshTokenClaims,
} from './token-claims';

const REFRESH_TTL_MS = 25 * 60 * 60 * 1000;
const INVALID_REFRESH = 'Refresh token is not valid. Please log in again';

type SessionDb = Prisma.TransactionClient | PrismaService;

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshTokenMatches(token: string, storedHash: string): boolean {
  const actual = new Uint8Array(Buffer.from(hashRefreshToken(token)));
  const expected = new Uint8Array(Buffer.from(storedHash));
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

function newSessionId(): string {
  return randomBytes(20).toString('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(req: Request) {
    const username: string = req.body.username;
    const pass: string = req.body.password;

    if (!username || !pass) {
      throw new BadRequestException('Login request malformed');
    }

    const user = await this.prisma.user.findFirst({
      select: {
        userId: true,
        password: true,
        gender: true,
        birthDateString: true,
        mobile: true,
        firstName: true,
        lastName: true,
        middleName: true,
        fullName: true,
        username: true,
        email: true,
      },
      where: { username },
    });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException({
        message: `Username and password mismatch `,
      });
    }

    const ret = { ...user };
    delete ret.password;
    return ret;
  }

  async getUserPermissions(
    userId: string,
    db?: SessionDb,
  ): Promise<ResoucePermissionType> {
    const client = db ?? this.prisma;
    const user = await client.user.findUniqueOrThrow({
      select: {
        userRoles: {
          select: {
            role: {
              select: {
                resourcePermissions: {
                  select: {
                    resourceName: true,
                    create: true,
                    view: true,
                    update: true,
                    delete: true,
                  },
                },
              },
            },
          },
        },
      },
      where: { userId },
    });

    const permissions: ResoucePermissionType = {};

    for (const assignment of user.userRoles) {
      for (const resource of assignment.role.resourcePermissions) {
        const { resourceName, create, view, update, delete: remove } = resource;
        if (!create && !view && !update && !remove) {
          continue;
        }
        const name = resourceName as ResourceName;
        const current = permissions[name] ?? {};
        permissions[name] = {
          create: !!(current.create || create),
          view: !!(current.view || view),
          update: !!(current.update || update),
          delete: !!(current.delete || remove),
        };
      }
    }

    return permissions;
  }

  async login(user: User, tenant: string) {
    return this.issueSession(this.prisma, user, tenant);
  }

  async refreshToken(refreshToken: string, tenant: string) {
    const claims = await this.readRefreshClaims(refreshToken, tenant);
    const session = await this.prisma.userRefreshToken.findUnique({
      where: { userRefreshTokenId: claims.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== claims.sub ||
      !refreshTokenMatches(refreshToken, session.refreshToken)
    ) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    if (session.revoked) {
      await this.revokeUserSessions(claims.sub);
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    return this.prisma.$transaction(async (tx) => {
      const rotated = await tx.userRefreshToken.updateMany({
        where: {
          userRefreshTokenId: session.userRefreshTokenId,
          revoked: false,
        },
        data: { revoked: true },
      });
      if (rotated.count !== 1) {
        throw new UnauthorizedException(INVALID_REFRESH);
      }
      return this.issueSession(tx, session.user, tenant);
    });
  }

  async logout(req: Request): Promise<void> {
    const tenant = getHost(req);
    await this.revokePresentedAccess(req, tenant);
    await this.revokePresentedRefresh(req, tenant);
  }

  async revokeUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.userRefreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    return result.count;
  }

  async revokeUserSessionsByAdmin(
    userId: string,
  ): Promise<RevokedSessionsEntity> {
    await this.prisma.user.findUniqueOrThrow({
      where: { userId },
      select: { userId: true },
    });
    const revoked = await this.revokeUserSessions(userId);
    return { userId, revoked };
  }

  async signup(signupDto: SignupDto): Promise<IDDto> {
    const { password, ...restDto } = signupDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const fullName = [
      signupDto.firstName,
      signupDto.middleName,
      signupDto.lastName,
    ].join(' ');

    const rec = await this.prisma.user.create({
      data: {
        userId: MakeTimedIDUnique(),
        fullName,
        password: hashedPassword,
        ...restDto,
      },
    });

    return { id: rec.userId };
  }

  private async issueSession(db: SessionDb, user: User, tenant: string) {
    const userRoles = await db.userRole.findMany({
      select: { role: { select: { roleName: true } } },
      where: { userId: user.userId },
    });
    const roles = userRoles.map((role) => role.role.roleName);
    const profile = new Profile(
      user.userId,
      user.fullName,
      user.username,
      user.firstName,
      user.middleName,
      user.lastName,
      user.mobile,
      roles,
    );
    const permissions = await this.getUserPermissions(user.userId, db);

    const userRefreshTokenId = newSessionId();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    const refreshToken = this.jwtService.sign(
      {
        sub: user.userId,
        sid: userRefreshTokenId,
        tenant,
        tokenUse: REFRESH_TOKEN_USE,
      },
      { secret: this.jwtSecret(), expiresIn: '25h' },
    );
    const authToken = this.jwtService.sign(
      {
        sub: user.userId,
        sid: userRefreshTokenId,
        tenant,
        tokenUse: ACCESS_TOKEN_USE,
        profile,
      },
      { secret: this.jwtSecret() },
    );

    await db.userRefreshToken.create({
      data: {
        userRefreshTokenId,
        refreshToken: hashRefreshToken(refreshToken),
        expiresAt,
        user: { connect: { userId: user.userId } },
      },
    });

    return {
      user: this.publicUser(user),
      profile,
      permissions,
      authToken,
      refreshToken,
    };
  }

  private publicUser(user: User): Omit<User, 'password'> {
    return {
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      fullName: user.fullName,
      gender: user.gender,
      birthDateString: user.birthDateString,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async readRefreshClaims(
    refreshToken: string,
    tenant: string,
  ): Promise<RefreshTokenClaims> {
    let payload: RefreshTokenClaims;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    if (
      payload?.tokenUse !== REFRESH_TOKEN_USE ||
      payload.tenant !== tenant ||
      !payload.sid ||
      !payload.sub
    ) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    return payload;
  }

  private async revokePresentedAccess(req: Request, tenant: string) {
    const token = this.readAccessToken(req);
    if (!token) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
        sid?: string;
        tenant?: string;
        tokenUse?: string;
      }>(token);
      if (
        payload.tokenUse !== ACCESS_TOKEN_USE ||
        payload.tenant !== tenant ||
        !payload.sid ||
        !payload.sub
      ) {
        return;
      }
      await this.prisma.userRefreshToken.updateMany({
        where: {
          userRefreshTokenId: payload.sid,
          userId: payload.sub,
          revoked: false,
        },
        data: { revoked: true },
      });
    } catch {
      return;
    }
  }

  private async revokePresentedRefresh(req: Request, tenant: string) {
    const token = this.readRefreshCookie(req);
    if (!token) {
      return;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<RefreshTokenClaims>(token);
      if (
        payload?.tokenUse !== REFRESH_TOKEN_USE ||
        payload.tenant !== tenant ||
        !payload.sid ||
        !payload.sub
      ) {
        return;
      }
      const session = await this.prisma.userRefreshToken.findUnique({
        where: { userRefreshTokenId: payload.sid },
        select: { userId: true, refreshToken: true, revoked: true },
      });
      if (
        !session ||
        session.revoked ||
        session.userId !== payload.sub ||
        !refreshTokenMatches(token, session.refreshToken)
      ) {
        return;
      }
      await this.prisma.userRefreshToken.updateMany({
        where: {
          userRefreshTokenId: payload.sid,
          userId: payload.sub,
          revoked: false,
        },
        data: { revoked: true },
      });
    } catch {
      return;
    }
  }

  private readAccessToken(req: Request): string | null {
    const cookie = this.readNamedCookie(req, 'AUTH_COOKIE_NAME');
    if (cookie) {
      return cookie;
    }
    const header = req.headers.authorization;
    if (!header) {
      return null;
    }
    if (header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    return header;
  }

  private readRefreshCookie(req: Request): string | null {
    return this.readNamedCookie(req, 'REFRESH_COOKIE_NAME');
  }

  private readNamedCookie(
    req: Request,
    name: 'AUTH_COOKIE_NAME' | 'REFRESH_COOKIE_NAME',
  ): string | null {
    const tenants =
      this.configService.get<Record<string, TenantConfig>>('multiTenant');
    const tenantConfig = tenants?.[getHost(req)];
    if (!tenantConfig) {
      return null;
    }

    try {
      const data = cookieParser.signedCookie(
        req.signedCookies?.[tenantConfig[name]],
        this.configService.getOrThrow<string>(
          EnvironmentVars.AUTH_COOKIE_SECRET,
        ),
      );
      if (!data) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private jwtSecret(): string {
    return this.configService.getOrThrow<string>(EnvironmentVars.JWT_SECRET);
  }
}
