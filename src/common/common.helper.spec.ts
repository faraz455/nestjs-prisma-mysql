import {
  getHost,
  getOffset,
  getPages,
  MakeTimedIDUnique,
  unixTimestamp,
} from './common.helper';
import { Request } from 'express';

function request(
  headers: Record<string, string>,
  originalUrl = '/articles',
): Request {
  return { headers, originalUrl } as Request;
}

describe('request helpers', () => {
  it('rewrites the IPv4 loopback host used by HTTP tests', () => {
    expect(getHost(request({ host: '127.0.0.1:4567' }))).toBe('localhost:3000');
    expect(getHost(request({ host: 'localhost:3000' }))).toBe('localhost:3000');
    expect(getHost(request({ host: 'other.example:3000' }))).toBe(
      'other.example:3000',
    );
  });

  it('reads header-host for private api calls and refuses a missing one', () => {
    expect(
      getHost(
        request(
          { host: 'localhost:3000', 'header-host': 'tenant.example' },
          '/private/apis/report',
        ),
      ),
    ).toBe('tenant.example');
    expect(
      getHost(request({ host: 'localhost:3000' }, '/private/apis/report')),
    ).toBe('impossiblestring');
  });

  it('computes list offsets and page counts', () => {
    expect(getOffset(1, 30)).toBe(0);
    expect(getOffset(2, 10)).toBe(10);
    expect(getOffset(3, 1)).toBe(2);
    expect(getPages(0, 10)).toBe(0);
    expect(getPages(10, 30)).toBe(1);
    expect(getPages(31, 30)).toBe(2);
    expect(getPages(5, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it('builds unique uppercase ids and a unix timestamp near now', () => {
    const first = MakeTimedIDUnique();
    const second = MakeTimedIDUnique();
    expect(first).toMatch(/^[0-9A-Z]+$/);
    expect(second).toMatch(/^[0-9A-Z]+$/);
    expect(second).not.toBe(first);
    expect(
      Math.abs(unixTimestamp() - Math.round(Date.now() / 1000)),
    ).toBeLessThanOrEqual(1);
  });
});
