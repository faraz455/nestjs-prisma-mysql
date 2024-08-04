import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  checkRoles,
  ROLES_KEY,
  RolesObject,
} from '../decorators/roles.decorator';
import { Profile } from '../dto';

@Injectable()
export class RolesGuards implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolesObject[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { user } = context.switchToHttp().getRequest();

    if (!requiredRoles) {
      return true;
    }

    const userRoles: string[] = user.profile.roles;

    let validate: boolean = true;
    for (const requiredRole of requiredRoles) {
      validate = checkRoles(requiredRole, userRoles);
      if (!validate) {
        break;
      }
    }
    return validate;
  }
}
