import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

function buildOptionsWithDefaults(options: StringOptions) {
  const usedOptions = new StringOptions();
  if (options) {
    let key: keyof StringOptions;
    for (key in usedOptions) {
      if (options[key]) {
        usedOptions[key] = options[key];
      }
    }
  }
  return usedOptions;
}

export class StringOptions {
  required?: boolean = true;
  trim?: boolean = true;
}

/**
 * Verify that the property decorated by this is a string that
 * matches the expectations of the CHI ecosystem.
 *
 * If optional, empty string will **ALWAYS** be transformed to `null`.
 *
 * @param optional - Apply the IsOptional validator, default `false`
 * default `false`
 */
export const IsCustomString = (options?: StringOptions) => {
  options = buildOptionsWithDefaults(options);

  let decorators: PropertyDecorator[] = [IsString(), IsNotEmpty()];
  if (!options.required) {
    decorators.push(IsOptional());
    decorators.push(Transform(({ value }) => (value != '' ? value : null)));
  }
  if (options.trim) {
    decorators.push(Transform(({ value }) => (value ? value.trim() : null)));
  }

  return applyDecorators(...decorators);
};
