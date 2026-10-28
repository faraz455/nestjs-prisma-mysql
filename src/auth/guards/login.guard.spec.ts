import { ExecutionContext } from '@nestjs/common';
import { ContextIdFactory } from '@nestjs/core';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { LoginGuard } from './login.guard';

function context(req: Request): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('LoginGuard', () => {
  const validateUser = jest.fn();
  const moduleRef = {
    resolve: jest.fn().mockResolvedValue({ validateUser }),
  };
  const guard = new LoginGuard(moduleRef as never);

  beforeEach(() => {
    validateUser.mockReset();
    moduleRef.resolve.mockClear();
  });

  it('attaches the validated user and resolves auth for this request', async () => {
    const req = { body: { username: 'ada', password: 'secret' } } as Request;
    const user = { userId: 'user-1', username: 'ada' };
    validateUser.mockResolvedValue(user);
    const spy = jest.spyOn(ContextIdFactory, 'getByRequest');

    await expect(guard.canActivate(context(req))).resolves.toBe(true);

    expect(spy).toHaveBeenCalledWith(req);
    expect(moduleRef.resolve).toHaveBeenCalled();
    expect((req as Request & { user?: unknown }).user).toBe(user);
    spy.mockRestore();
  });

  it('propagates a failed login', async () => {
    const req = { body: {} } as Request;
    validateUser.mockRejectedValue(new UnauthorizedException());
    await expect(guard.canActivate(context(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('denies the route when validation returns no user', async () => {
    const req = { body: { username: 'ada', password: 'secret' } } as Request;
    validateUser.mockResolvedValue(null);
    await expect(guard.canActivate(context(req))).resolves.toBe(false);
    expect((req as Request & { user?: unknown }).user).toBeUndefined();
  });
});
