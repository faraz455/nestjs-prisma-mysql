import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Response } from 'express';

import { TenantConfig } from '../multi-tenant/multi-tenant.config';
import { TENANT_CONFIG } from '../multi-tenant/multi-tenant.module';

import { AuthService } from './auth.service';

import { GetUser } from './decorators';
import { LoginGuard } from './guards/login.guard';
import { CustomJwtGuard } from './guards/custom-jwt.guard';

import { IDDto } from 'src/common/dto';
import { LoginEntity } from './entities';
import { LoginDto, RefreshTokenDto, SignupDto } from './dto';
import { User } from '@prisma/client';
import { ThrottlerBehindProxyGuard } from './guards/throttler-behind-proxy.guard';

@UseGuards(ThrottlerBehindProxyGuard)
// @UseGuards(CustomJwtGuard)
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
    @Body() loginDto: LoginDto,
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.login(user);

    res.cookie(this.tConfig.AUTH_COOKIE_NAME, payload.authToken, {
      signed: true,
    });

    res.cookie(this.tConfig.REFRESH_COOKIE_NAME, payload.refreshToken, {
      signed: true,
    });

    return payload;
  }

  @ApiOkResponse({ type: LoginEntity })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Body() data: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.refreshToken(data.refreshToken);

    res.cookie(this.tConfig.AUTH_COOKIE_NAME, payload.authToken, {
      signed: true,
    });

    res.cookie(this.tConfig.REFRESH_COOKIE_NAME, payload.refreshToken, {
      signed: true,
    });

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
  @Post('logout')
  async PostLogout(
    @Res({ passthrough: true })
    res: Response,
  ) {
    await this.authService.logout();
    res.clearCookie(this.tConfig.AUTH_COOKIE_NAME, { signed: true });
    res.clearCookie(this.tConfig.REFRESH_COOKIE_NAME, { signed: true });
  }
}
