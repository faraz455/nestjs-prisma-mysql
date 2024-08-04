import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  PERMISSIONS_KEY,
  IS_PUBLIC_KEY,
  PermsObject,
  checkPermission,
} from '../decorators';

import { Profile, ResoucePermissionType, ResourceName } from '../dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_SERVICE } from 'src/multi-tenant/multi-tenant.module';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<PermsObject[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const profile: Profile = user.profile;

    const rolePermissions = await this.getRolePermissions(profile.roles);

    let validate: boolean = true;
    for (const requiredPermission of requiredPermissions) {
      validate = checkPermission(requiredPermission, rolePermissions);
      if (!validate) {
        break;
      }
    }
    return validate;
  }

  async getRolePermissions(roles: string[]): Promise<ResoucePermissionType> {
    const recs = await this.prisma.resourcePermission.findMany({
      select: {
        resourceName: true,
        create: true,
        view: true,
        update: true,
        delete: true,
      },
      where: {
        role: { roleName: { in: roles } },
        OR: [
          { view: true },
          { create: true },
          { update: true },
          { view: true },
        ],
      },
    });

    let perms: ResoucePermissionType = {};

    recs.map((rec) => {
      const { resourceName, ...permission } = rec;
      const name = resourceName as ResourceName;
      perms[name] = permission;
    });

    return perms;
  }
}
