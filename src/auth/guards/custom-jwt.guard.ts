import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators';
import {
  PRISMA_SERVICE,
  TENANT_CONFIG,
} from 'src/multi-tenant/multi-tenant.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVars } from 'src/common/common.types';
import { TenantConfig } from 'src/multi-tenant/multi-tenant.config';
import { getHost, unixTimestamp } from 'src/common/common.helper';
import * as cookieParser from 'cookie-parser';
import { Profile } from '../dto';
import { AuthService } from '../auth.service';

export type ReqUserObj = {
  userId: string;
  userEmail: string;
  profile: Profile;
};

@Injectable()
export class CustomJwtGuard implements CanActivate {
  private jwtService: JwtService;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
  ) {
    this.jwtService = new JwtService({
      secret: this.configService.getOrThrow(EnvironmentVars.JWT_SECRET),
    });
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req: Request = context.switchToHttp().getRequest();
    const { accessToken, refreshToken } = this.extractJwtTokenFromRequest(req);

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    const currentTime = unixTimestamp();
    const decodedAccessToken = this.jwtService.decode(accessToken);

    if (decodedAccessToken.exp < currentTime) {
      const decodedRefreshToken: {
        exp: number;
        userId: string;
        userRefreshTokenId: string;
      } = this.jwtService.decode(refreshToken);

      if (decodedRefreshToken.exp < currentTime) {
        throw new UnauthorizedException();
      }

      const userRefreshToken =
        await this.prisma.userRefreshToken.findUniqueOrThrow({
          select: { revoked: true },
          where: {
            userRefreshTokenId: decodedRefreshToken.userRefreshTokenId,
            OR: [{ revoked: true }, { expiresAt: { lte: new Date() } }],
          },
        });

      // If is already revoked
      if (userRefreshToken) {
        throw new UnauthorizedException();
      }

      const user = await this.prisma.user.findUniqueOrThrow({
        where: { userId: decodedRefreshToken.userId },
      });

      const authService = new AuthService(
        this.prisma,
        this.jwtService,
        this.configService,
      );

      await authService.login(user);

      await this.prisma.userRefreshToken.update({
        data: { revoked: true },
        where: { userRefreshTokenId: decodedRefreshToken.userRefreshTokenId },
      });
    }

    const user = this.constructUserObj(decodedAccessToken);

    if (await this.checkUserSessions(user.profile.userId)) {
      req.user = user;
      return true;
    }

    throw new UnauthorizedException();
  }

  private constructUserObj(payload: any): ReqUserObj {
    return {
      userId: payload.sub,
      userEmail: payload.userEmail,
      profile: payload.profile,
    };
  }

  private extractJwtTokenFromRequest(req: Request): {
    accessToken: string;
    refreshToken: string;
  } {
    let { accessToken, refreshToken } = this.extJwtAndRefreshTokenFromCookies(
      req,
    ) ?? { accessToken: null, refreshToken: null };

    if (!accessToken) {
      // extract as bearer token
      accessToken = req.headers.authorization?.split(' ')[1];
    }
    if (!accessToken) {
      // extract as auth header
      accessToken = req.headers.authorization;
    }

    return { accessToken, refreshToken };
  }

  private extJwtAndRefreshTokenFromCookies(req: Request): {
    accessToken: string;
    refreshToken: string;
  } {
    const tConfig: TenantConfig =
      this.configService.get('multiTenant')[getHost(req)];

    try {
      const accessToken = cookieParser.signedCookie(
        req.signedCookies[tConfig.AUTH_COOKIE_NAME],
        this.configService.getOrThrow<string>(
          EnvironmentVars.AUTH_COOKIE_SECRET,
        ),
      );

      const refreshToken = cookieParser.signedCookie(
        req.signedCookies[tConfig.REFRESH_COOKIE_NAME],
        this.configService.getOrThrow<string>(
          EnvironmentVars.AUTH_COOKIE_SECRET,
        ),
      );

      if (!accessToken || !refreshToken) {
        return null;
      }

      return { accessToken, refreshToken };
    } catch (error) {
      return null;
    }
  }

  private async checkUserSessions(userId: string) {
    // Need to implement refresh token
    const sessionCount = 1;
    return sessionCount > 0 ? true : false;
  }
}
