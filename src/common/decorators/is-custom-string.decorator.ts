import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

function buildOptionsWithDefaults(options: StringOptions) {
  const usedOptions: StringOptions = {
    required: true,
    ...options,
  };
  return usedOptions;
}

export class StringOptions {
  required?: boolean = true;
}

/**
 * Verify that the property decorated by this is a string
 *
 * If optional, empty string will **ALWAYS** be transformed to `null`.
 *
 * @param optional - Apply the required validator, default `true`
 */
export const IsCustomString = (options?: StringOptions) => {
  options = buildOptionsWithDefaults(options);

  let decorators: PropertyDecorator[] = [IsString(), IsNotEmpty()];
  decorators.push(Transform(({ value }) => (value != '' ? value : null)));

  if (!options.required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
};
