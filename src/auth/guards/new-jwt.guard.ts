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
import { getHost } from 'src/common/common.helper';
import * as cookieParser from 'cookie-parser';
import { Profile } from '../dto';

export type ReqUserObj = {
  userId: string;
  userEmail: string;
  profile: Profile;
  userDeviceId: string;
};

@Injectable()
export class NewJwtGuard implements CanActivate {
  private jwtService: JwtService;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
    @Inject(TENANT_CONFIG) tConfig: TenantConfig,
  ) {
    this.jwtService = new JwtService({
      verifyOptions: { ignoreExpiration: true },
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
    const token = this.extractJwtTokenFromRequest(req);

    if (!token) {
      throw new UnauthorizedException();
    }

    const decodedToken = this.jwtService.decode(token);
    const user = this.constructUserObj(decodedToken);

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
      userDeviceId: payload.userDeviceId,
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

  private async checkUserSessions(userId: string) {
    const sessionCount = 1;
    console.log(sessionCount);
    return sessionCount > 0 ? true : false;
  }
}
