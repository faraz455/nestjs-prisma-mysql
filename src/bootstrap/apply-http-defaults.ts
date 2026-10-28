import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClientExceptionFilter } from '../prisma/prisma-client-exception.filter';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

export const httpValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

/**
 * Pipe, Prisma error mapping, signed cookies, and body limits shared by
 * `main.ts` and the HTTP tests.
 */
export function applyHttpDefaults(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe(httpValidationOptions));
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.use(cookieParser(process.env.AUTH_COOKIE_SECRET));
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
}
