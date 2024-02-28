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

import { GetUser, Public } from './decorators';
import { LoginGuard } from './guards/login.guard';
import { CustomJwtGuard } from './guards/custom-jwt.guard';

import { IDDto } from 'src/common/dto';
import { LoginEntity } from './entities';
import { LoginDto, SignupDto } from './dto';

@UseGuards(CustomJwtGuard)
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(TENANT_CONFIG) private tConfig: TenantConfig,
  ) {}

  @Public()
  @ApiOkResponse({ type: LoginEntity })
  @UseGuards(LoginGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @GetUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.authService.login(user);

    res.cookie(this.tConfig.AUTH_COOKIE_NAME, payload.authToken, {
      signed: true,
    });

    return payload;
  }

  @Public()
  @ApiOkResponse({ type: IDDto })
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const payload = await this.authService.signup(signupDto);

    return payload;
  }

  @Public()
  @ApiOkResponse()
  @Post('logout')
  async PostLogout(
    @Res({ passthrough: true })
    res: Response,
  ) {
    await this.authService.logout();
    res.clearCookie(this.tConfig.AUTH_COOKIE_NAME, { signed: true });
  }
}
