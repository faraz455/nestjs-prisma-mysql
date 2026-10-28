import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ReqUserObj } from '../guards/custom-jwt.guard';

export const GetUser = createParamDecorator(
  (key: keyof ReqUserObj | undefined, ctx: ExecutionContext) => {
    const req: Express.Request = ctx.switchToHttp().getRequest();
    if (key) {
      // @ts-expect-error Express request has no user until the guard sets it
      return req.user ? req.user[key] : undefined;
    }
    // @ts-expect-error Express request has no user until the guard sets it
    return req.user ? req.user : undefined;
  },
);
