import { BadRequestException } from '@nestjs/common';
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  assertPassword,
  assertPasswordMaxBytes,
} from './password';

describe('password rules', () => {
  it('accepts a password inside the length and byte limits', () => {
    expect(() => assertPassword('password')).not.toThrow();
    expect(() => assertPassword('a'.repeat(PASSWORD_MAX_BYTES))).not.toThrow();
  });

  it('rejects a short password and one bcrypt would truncate', () => {
    expect(() => assertPassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toThrow(
      BadRequestException,
    );
    expect(() => assertPassword('a'.repeat(PASSWORD_MAX_BYTES + 1))).toThrow(
      BadRequestException,
    );
    expect(() => assertPassword('😀'.repeat(20))).toThrow(BadRequestException);
  });

  it('allows a short password at login and still rejects an oversized one', () => {
    expect(() => assertPasswordMaxBytes('nope')).not.toThrow();
    expect(() =>
      assertPasswordMaxBytes('a'.repeat(PASSWORD_MAX_BYTES + 1)),
    ).toThrow(BadRequestException);
  });
});
