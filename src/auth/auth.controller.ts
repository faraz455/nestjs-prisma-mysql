import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CookieOptions, Request, Response } from 'express';

import { TenantConfig } from '../multi-tenant/multi-tenant.config';
import { TENANT_CONFIG } from '../multi-tenant/multi-tenant.module';
import { getHost } from 'src/common/common.helper';

import { AuthService } from './auth.service';

import { GetUser } from './decorators';
import { AuthRateLimitGuard } from './auth-rate-limit';
import { LoginGuard } from './guards/login.guard';
import { CustomJwtGuard, ReqUserObj } from './guards/custom-jwt.guard';

import { IDDto } from 'src/common/dto';
import { LoginEntity, RevokedSessionsEntity } from './entities';
import { LoginDto, SignupDto } from './dto';
import { User } from '../generated/prisma/client';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(TENANT_CONFIG) private tConfig: TenantConfig,
  ) {}

  @ApiOkResponse({ type: LoginEntity })
  @UseGuards(AuthRateLimitGuard, LoginGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.login(user, getHost(req));
    this.setAuthCookies(res, payload.authToken, payload.refreshToken);
    return this.sessionBody(payload);
  }

  @ApiOkResponse({ type: LoginEntity })
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.refreshFromCookie(req);
    this.setAuthCookies(res, payload.authToken, payload.refreshToken);
    return this.sessionBody(payload);
  }

  @ApiOkResponse({ type: IDDto })
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const payload = await this.authService.signup(signupDto);
    return payload;
  }

  @ApiOkResponse()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req);
    this.clearAuthCookies(res);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: RevokedSessionsEntity })
  @UseGuards(CustomJwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(
    @GetUser() user: ReqUserObj,
    @Res({ passthrough: true }) res: Response,
  ) {
    const revoked = await this.authService.revokeUserSessions(user.userId);
    this.clearAuthCookies(res);
    return { userId: user.userId, revoked };
  }

  @ApiOkResponse({ type: LoginEntity })
  @UseGuards(CustomJwtGuard)
  @Get('me')
  async getMe(@GetUser() user: ReqUserObj) {
    return user;
  }

  private sessionBody(
    payload: LoginEntity & { refreshToken: string },
  ): LoginEntity {
    return {
      user: payload.user,
      profile: payload.profile,
      permissions: payload.permissions,
      authToken: payload.authToken,
    };
  }

  private setAuthCookies(
    res: Response,
    authToken: string,
    refreshToken: string,
  ) {
    res.cookie(
      this.tConfig.AUTH_COOKIE_NAME,
      authToken,
      authCookieOptions(ACCESS_COOKIE_MAX_AGE_MS),
    );
    res.cookie(
      this.tConfig.REFRESH_COOKIE_NAME,
      refreshToken,
      authCookieOptions(REFRESH_COOKIE_MAX_AGE_MS),
    );
  }

  private clearAuthCookies(res: Response) {
    const options = authCookieOptions(0);
    delete options.maxAge;
    res.clearCookie(this.tConfig.AUTH_COOKIE_NAME, options);
    res.clearCookie(this.tConfig.REFRESH_COOKIE_NAME, options);
  }
}

const ACCESS_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 25 * 60 * 60 * 1000;

function authCookieOptions(maxAge: number): CookieOptions {
  return {
    signed: true,
    httpOnly: true,
    secure: process.env.PRODUCTION !== '0',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}
