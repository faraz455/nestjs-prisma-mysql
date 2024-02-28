import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Request } from 'express';

import {
  MakeTimedIDUnique,
  decryptText,
  unixTimestamp,
} from 'src/common/common.helper';

import { PRISMA_SERVICE } from '../multi-tenant/multi-tenant.module';
import { Profile, ResoucePermissionType, ResourceName } from './dto';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { IDDto } from 'src/common/dto';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVars } from 'src/common/common.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(req: Request) {
    let mobile: string = req.body.mobile;
    let pass: string = req.body.password;

    if (!mobile || !pass) {
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
      where: { mobile: mobile },
    });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException({
        message: `Phone no. and password mismatch `,
      });
    }

    const { password, ...ret } = user;
    return ret;
  }

  async validateSession(req: Request) {
    const mobile: string = req?.body?.mobile;

    const sessionCount = 1;
    return sessionCount > 0 ? true : false;
  }

  async getUserPermissions(userId: string): Promise<ResoucePermissionType> {
    const user = await this.prisma.user.findUniqueOrThrow({
      select: {
        userRoles: {
          select: {
            role: {
              select: {
                resourcePermissions: {
                  select: { resourceName: true, create: true, view: true },
                },
              },
            },
          },
        },
      },
      where: { userId },
    });

    let permissions: ResoucePermissionType = {};

    user.userRoles.map((roles) => {
      roles.role.resourcePermissions.map((resource) => {
        const { resourceName, ...perms } = resource;

        if (perms.create === true || perms.view === true) {
          const name = resourceName as ResourceName;
          permissions[name] = perms;
        }
      });
    });

    return permissions;
  }

  async login(user: User, tzOffset: number = 0) {
    const userRoles = await this.prisma.userRole.findMany({
      select: { role: { select: { roleName: true } } },
      where: { userId: user.userId },
    });

    let roles: string[] = userRoles.map((role) => role.role.roleName);

    const profile = new Profile(
      user.userId,
      user.fullName,
      user.firstName,
      user.middleName,
      user.lastName,
      user.mobile,
      roles,
      tzOffset,
    );

    const payload = {
      user,
      profile,
    };

    const authToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>(EnvironmentVars.JWT_SECRET),
    });

    const userRefreshTokenId = MakeTimedIDUnique();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const refreshTokenPayload = {
      userId: user.userId,
      userRefreshTokenId,
    };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.getOrThrow<string>(EnvironmentVars.JWT_SECRET),
      expiresIn: '1h',
    });

    await this.prisma.userRefreshToken.create({
      data: {
        userRefreshTokenId,
        refreshToken,
        user: { connect: { userId: user.userId } },
        expiresAt,
      },
    });

    const permissions = await this.getUserPermissions(profile.userId);

    const load = {
      user,
      profile,
      permissions,
      authToken,
      refreshToken,
    };

    return load;
  }

  async signup(signupDto: SignupDto): Promise<IDDto> {
    const { password, ...restDto } = signupDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(signupDto.password, salt);

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

  async logout() {}
}
