import { Request } from 'express';

import CryptoJS from 'crypto-js';
const CryptoJS1: typeof CryptoJS = require('crypto-js');

function timeStampMilliseconds(): number {
  return new Date().getTime();
}

export function unixTimestamp(): number {
  return Math.round(timeStampMilliseconds() / 1000);
}

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function syncSleep(ms: number) {
  const timestamp = timeStampMilliseconds() + ms;
  while (timeStampMilliseconds() < timestamp);
}

const BASE36_ALPHABETS: string = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function MakeTimedIDUnique(): string {
  syncSleep(1);

  let base36: string = '';
  let num: number = Math.round(timeStampMilliseconds() * 1000);
  while (num != 0) {
    const idx = num % BASE36_ALPHABETS.length;
    num = Math.floor(num / BASE36_ALPHABETS.length);
    base36 = BASE36_ALPHABETS[idx] + base36;
  }
  return base36;
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
    // @ts-ignore
    host = req.headers['header-host'];
    if (!host) {
      return 'impossiblestring';
    }
  }

  // check 127.0.0.1 to support tests
  return host.includes('127.0.0.1:') ? 'localhost:3000' : host;
}

export function decryptText(text: string) {
  const secret = 'k0gn!tea!veHE@lTeAachK@rE';
  const salt = 'cha@r@em$';

  const bytes = CryptoJS1.PBKDF2(secret, salt, {
    keySize: 48,
    iterations: 128,
  });
  const iv = CryptoJS1.enc.Hex.parse(bytes.toString().slice(0, 32));
  const key = CryptoJS1.enc.Hex.parse(bytes.toString().slice(32, 96));

  try {
    const cipher = CryptoJS1.AES.decrypt(text, key, {
      iv,
      mode: CryptoJS1.mode.CBC,
    });
    return cipher.toString(CryptoJS1.enc.Utf8);
  } catch (error) {
    console.error(error);
    return null;
  }
}
