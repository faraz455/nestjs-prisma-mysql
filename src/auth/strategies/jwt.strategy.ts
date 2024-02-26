import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as cookieParser from 'cookie-parser';

import { TenantConfig } from '../../multi-tenant/multi-tenant.config';
import { getHost } from '../../common/common.helper';
import { EnvironmentVars } from 'src/common/common.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(protected configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const tConfig: TenantConfig =
            this.configService.get('multiTenant')[getHost(req)];

          try {
            const data = cookieParser.signedCookie(
              req.signedCookies[tConfig.AUTH_COOKIE_NAME],
              configService.getOrThrow<string>(
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
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromHeader('authorization'),
      ]),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>(EnvironmentVars.JWT_SECRET),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      userEmail: payload.userEmail,
      role: payload.role,
      mappings: payload.mappings,
      profile: payload.profile,
      permissions: payload.permissions,
      userDeviceId: payload.userDeviceId,
    };
  }
}
