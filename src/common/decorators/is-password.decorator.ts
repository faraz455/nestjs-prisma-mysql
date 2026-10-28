import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsString, ValidateBy } from 'class-validator';
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_RULE,
  passwordIsAcceptable,
  passwordTooLong,
} from '../password';
import { StringOptions } from './is-custom-string.decorator';

export const IsPassword = (options?: StringOptions) => {
  const required = options?.required !== false;
  const decorators: PropertyDecorator[] = [
    IsString(),
    ValidateBy({
      name: 'isPassword',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && passwordIsAcceptable(value),
        defaultMessage: () => PASSWORD_RULE,
      },
    }),
  ];
  if (!required) {
    decorators.push(IsOptional());
  }
  return applyDecorators(...decorators);
};

export const MaxPasswordBytes = () =>
  ValidateBy({
    name: 'maxPasswordBytes',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && !passwordTooLong(value),
      defaultMessage: () =>
        `password must be at most ${PASSWORD_MAX_BYTES} bytes`,
    },
  });
