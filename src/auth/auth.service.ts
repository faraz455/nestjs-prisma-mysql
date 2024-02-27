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
import * as md5 from 'md5';

import { decryptText } from 'src/common/common.helper';

import { PRISMA_SERVICE } from '../multi-tenant/multi-tenant.module';
import { Profile, ResoucePermissionType, ResourceName } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(req: Request) {
    const encPassword: string | undefined = req.body.enc_password;
    let mobile: string = req.body.mobile;
    let pass: string = req.body.password;

    if (!!encPassword) {
      const parts = req.body.enc_password.split('.');
      mobile = decryptText(parts[0]);
      pass = decryptText(parts[1]);
    }

    if (!mobile || !pass) {
      throw new BadRequestException('Login request malformed');
    }

    const hashPassword = md5(pass);
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

    if (!user || hashPassword != user?.password) {
      throw new UnauthorizedException({
        deviceVerificationRequired: false,
        message: `Phone no. and password mismatch `,
      });
    }

    const { password, ...ret } = user;
    return ret;
  }

  async validateSession(req: Request) {
    const encPassword: string | undefined = req.body.enc_password;
    let mobile: string = req?.body?.mobile;

    if (!!encPassword) {
      const parts = req.body.enc_password.split('.');
      mobile = decryptText(parts[0]);
    }

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

  async login(userInfo: User, tzOffset: number = 0) {
    const userRoles = await this.prisma.userRole.findMany({
      select: { role: { select: { roleName: true } } },
      where: { userId: userInfo.userId },
    });

    let roles: {
      role: string;
    }[] = userRoles.map((role) => {
      return {
        role: role.role.roleName,
      };
    });

    const profile = new Profile(
      userInfo.userId,
      userInfo.fullName,
      userInfo.firstName,
      userInfo.middleName,
      userInfo.lastName,
      userInfo.mobile,
      roles,
      tzOffset,
    );

    const user = {
      ...userInfo,
    };

    const payload = {
      user,
      profile,
    };

    const encodedJWT = this.jwtService.sign(payload);

    const permissions = await this.getUserPermissions(profile.userId);

    const load = {
      user,
      profile,
      permissions,
      auth_token: encodedJWT,
    };

    return load;
  }

  async logout() {}
}
