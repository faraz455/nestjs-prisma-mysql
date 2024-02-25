import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import * as path from 'path';
const fs = require('fs');

import { PrismaService } from '../prisma/prisma.service';

function timeStampMilliseconds(): number {
  return new Date().getTime();
}

export function unix_timestamp(): number {
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

export function datesForCreate() {
  const timestamp: number = unix_timestamp();
  return { date_added: timestamp, date_updated: timestamp };
}

export function roundToNPlaces(num: number, N: number): number {
  // @ts-ignore
  return Number(Math.round(num + 'e' + N) + 'e-' + N);
}

function getPrimaryKeys(filename: string) {
  let modelPrimaryKey: {
    [key: string]: string;
  } = {};

  try {
    // read contents of the file
    const data = fs.readFileSync(filename, 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    // print all lines
    let currModel = '';
    let modelOngoing = false;
    for (let i = 0; i < lines.length; i++) {
      const currLine = lines[i];

      if (!modelOngoing) {
        if (currLine.includes('model')) {
          currModel = currLine.split(' ')[1];
          modelOngoing = true;
        }
      } else {
        if (currLine.includes('@id')) {
          const primaryKey = currLine.split(/\s+/)[1];
          modelOngoing = false;
          // console.log(primaryKey)
          modelPrimaryKey[currModel] = primaryKey;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  return modelPrimaryKey;
}
export const modelPrimaryKeys = getPrimaryKeys('./prisma/schema.prisma');

export async function moveFile(from: string, to: string) {
  try {
    // Copying the file to folder
    fs.copyFileSync(from, to);
    // Delete After coping file
    fs.unlinkSync(from);
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException("Can't move file");
  }
}

export function createDir(path: string, root: string, dir: string) {
  if (!fs.existsSync(`${root}/${dir}`)) {
    fs.mkdirSync(`${root}/${dir}`);
  }
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

export function startOfDay(timestamp: number, tzOffset: number) {
  const start = new Date((timestamp + tzOffset) * 1000);
  start.setUTCHours(0, 0, 0, 0);
  return Math.round(start.getTime() / 1000);
}

export function endOfDay(timestamp: number, tzOffset: number) {
  const end = new Date((timestamp + tzOffset) * 1000);
  end.setUTCHours(23, 59, 59, 999);
  return Math.round(end.getTime() / 1000);
}

export function snakeCaseToCamelCase(input: string) {
  input = input
    .split('_')
    .reduce(
      (res: string, word: string) =>
        `${res} ${word.charAt(0).toUpperCase()}${word
          .substring(1)
          .toLowerCase()}`,
      '',
    );
  return input.slice(1);
}
