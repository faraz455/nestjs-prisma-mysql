import { BadRequestException } from '@nestjs/common';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULE = `password must be at least ${PASSWORD_MIN_LENGTH} characters and at most ${PASSWORD_MAX_BYTES} bytes`;

export function passwordTooLong(password: string): boolean {
  return Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES;
}

export function passwordIsAcceptable(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && !passwordTooLong(password);
}

export function assertPassword(password: string): void {
  if (!passwordIsAcceptable(password)) {
    throw new BadRequestException(PASSWORD_RULE);
  }
}

export function assertPasswordMaxBytes(password: string): void {
  if (passwordTooLong(password)) {
    throw new BadRequestException(
      `password must be at most ${PASSWORD_MAX_BYTES} bytes`,
    );
  }
}
