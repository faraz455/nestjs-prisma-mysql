import { ConfigService } from '@nestjs/config';
import { lastValueFrom, Observable, of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { RequestResponseInterceptor } from './request-response.interceptor';

function interceptor(flag: unknown) {
  return new RequestResponseInterceptor({
    get: () => flag,
  } as unknown as ConfigService);
}

function context(body: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () =>
        ({
          headers: { host: 'localhost:3000' },
          url: '/auth/login',
          body,
        }) as unknown,
    }),
  } as ExecutionContext;
}

describe('RequestResponseInterceptor', () => {
  const handle = {
    handle: () =>
      of({
        username: 'ada',
        authToken: 'access-plain',
        refreshToken: 'refresh-plain',
      }),
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([0, '0'])('does not log when LOG_REQUESTS is %s', async (flag) => {
    const result = await lastValueFrom(
      interceptor(flag).intercept(
        context({ username: 'ada', password: 'pw-plain' }),
        handle,
      ) as Observable<unknown>,
    );
    expect(result).toMatchObject({ username: 'ada' });
    expect(console.log).not.toHaveBeenCalled();
  });

  it.each([1, undefined])(
    'redacts secrets when LOG_REQUESTS is %s',
    async (flag) => {
      await lastValueFrom(
        interceptor(flag).intercept(
          context({ username: 'ada', password: 'pw-plain' }),
          handle,
        ) as Observable<unknown>,
      );
      const dumped = JSON.stringify(jest.mocked(console.log).mock.calls);
      expect(dumped).toContain('ada');
      expect(dumped).toContain('[redacted]');
      expect(dumped).not.toContain('pw-plain');
      expect(dumped).not.toContain('access-plain');
      expect(dumped).not.toContain('refresh-plain');
    },
  );
});
