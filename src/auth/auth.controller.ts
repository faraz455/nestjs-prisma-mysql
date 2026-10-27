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

import { Request, Response } from 'express';

import { TenantConfig } from '../multi-tenant/multi-tenant.config';
import { TENANT_CONFIG } from '../multi-tenant/multi-tenant.module';
import { getHost } from 'src/common/common.helper';

import { AuthService } from './auth.service';

import { GetUser } from './decorators';
import { LoginGuard } from './guards/login.guard';
import { CustomJwtGuard, ReqUserObj } from './guards/custom-jwt.guard';

import { IDDto } from 'src/common/dto';
import { LoginEntity, RevokedSessionsEntity } from './entities';
import { LoginDto, RefreshTokenDto, SignupDto } from './dto';
import { User } from '../generated/prisma/client';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(TENANT_CONFIG) private tConfig: TenantConfig,
  ) {}

  @ApiOkResponse({ type: LoginEntity })
  @UseGuards(LoginGuard)
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
    return payload;
  }

  @ApiOkResponse({ type: LoginEntity })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Body() data: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.refreshToken(
      data.refreshToken,
      getHost(req),
    );
    this.setAuthCookies(res, payload.authToken, payload.refreshToken);
    return payload;
  }

  @ApiOkResponse({ type: IDDto })
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

  private setAuthCookies(
    res: Response,
    authToken: string,
    refreshToken: string,
  ) {
    res.cookie(this.tConfig.AUTH_COOKIE_NAME, authToken, { signed: true });
    res.cookie(this.tConfig.REFRESH_COOKIE_NAME, refreshToken, {
      signed: true,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(this.tConfig.AUTH_COOKIE_NAME, { signed: true });
    res.clearCookie(this.tConfig.REFRESH_COOKIE_NAME, { signed: true });
  }
}
