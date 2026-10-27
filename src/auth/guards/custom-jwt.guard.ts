import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVars } from 'src/common/common.types';
import { TenantConfig } from 'src/multi-tenant/multi-tenant.config';
import { getHost } from 'src/common/common.helper';
import cookieParser from 'cookie-parser';
import { Profile } from '../dto';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_SERVICE } from 'src/multi-tenant/multi-tenant.module';
import { ACCESS_TOKEN_USE, AccessTokenClaims } from '../token-claims';

export type ReqUserObj = {
  userId: string;
  userName: string;
  sessionId: string;
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

    const req: Request & { user?: ReqUserObj } = context
      .switchToHttp()
      .getRequest();
    const token = this.extractJwtTokenFromRequest(req);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: AccessTokenClaims;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    if (!this.accessClaimsMatchRequest(payload, getHost(req))) {
      throw new UnauthorizedException();
    }

    const reqUser = this.constructUserObj(payload);
    reqUser.profile.roles = await this.currentRoleNames(
      payload.sub,
      payload.sid,
    );
    req.user = reqUser;
    return true;
  }

  private accessClaimsMatchRequest(
    payload: AccessTokenClaims,
    tenant: string,
  ): boolean {
    return (
      payload?.tokenUse === ACCESS_TOKEN_USE &&
      payload.tenant === tenant &&
      !!payload.sid &&
      !!payload.sub &&
      payload.profile?.userId === payload.sub
    );
  }

  private async currentRoleNames(
    userId: string,
    sessionId: string,
  ): Promise<string[]> {
    const session = await this.prisma.userRefreshToken.findUnique({
      where: { userRefreshTokenId: sessionId },
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

    if (
      !session ||
      session.revoked ||
      session.userId !== userId ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException();
    }

    return session.user.userRoles.map((userRole) => userRole.role.roleName);
  }

  private constructUserObj(payload: AccessTokenClaims): ReqUserObj {
    return {
      userId: payload.sub,
      sessionId: payload.sid,
      profile: payload.profile,
      userName: payload.profile.username,
    };
  }

  private extractJwtTokenFromRequest(req: Request) {
    let token: string = this.extractJwtTokenFromCookies(req);

    if (!token) {
      // extract as bearer token
      token = req.headers.authorization?.split(' ')[1];
    }
    if (!token) {
      // extract as auth header
      token = req.headers.authorization;
    }

    return token;
  }

  private extractJwtTokenFromCookies(req: Request) {
    const tConfig: TenantConfig =
      this.configService.get('multiTenant')[getHost(req)];

    try {
      const data = cookieParser.signedCookie(
        req.signedCookies[tConfig.AUTH_COOKIE_NAME],
        this.configService.getOrThrow<string>(
          EnvironmentVars.AUTH_COOKIE_SECRET,
        ),
      );
      if (!data) {
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  }
}
