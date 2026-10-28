import { Request } from 'express';

function timeStampMilliseconds(): number {
  return new Date().getTime();
}

export function unixTimestamp(): number {
  return Math.round(timeStampMilliseconds() / 1000);
}

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getOffset(page: number, per_page: number) {
  return page == 1 ? 0 : per_page * (page - 1);
}

export function getPages(count: number, per_page: number) {
  let pages: number = 0;
  if (count > 0) {
    per_page = per_page > count ? count : per_page;
    pages = Math.ceil(count / per_page);
  }
  return pages;
}

export function getHost(req: Request) {
  let host: string = req.headers.host!;
  if (req.originalUrl.includes('private/apis')) {
    // @ts-expect-error header-host is a string set by the private API caller
    host = req.headers['header-host'];
    if (!host) {
      return 'impossiblestring';
    }
  }

  // check 127.0.0.1 to support tests
  return host.includes('127.0.0.1:') ? 'localhost:3000' : host;
}
