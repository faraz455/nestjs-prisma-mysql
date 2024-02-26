import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ContextIdFactory, ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const contextId = ContextIdFactory.getByRequest(req);
    const authService = await this.moduleRef.resolve(AuthService, contextId);

    const user = await authService.validateUser(req);
    if (user) {
      req.user = user;
      return true;
    }

    return false;
  }
}
