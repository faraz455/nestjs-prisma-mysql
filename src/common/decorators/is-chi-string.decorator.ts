import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

function buildOptionsWithDefaults(options: ChiStringOptions) {
  const usedOptions = new ChiStringOptions();
  if (options) {
    let key: keyof ChiStringOptions;
    for (key in usedOptions) {
      if (options[key]) {
        usedOptions[key] = options[key];
      }
    }
  }
  return usedOptions;
}

export class ChiStringOptions {
  optional?: boolean = false;
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
export const IsChiString = (options?: ChiStringOptions) => {
  options = buildOptionsWithDefaults(options);

  let decorators: PropertyDecorator[] = [IsString(), IsNotEmpty()];
  if (options.optional) {
    decorators.push(IsOptional());
    decorators.push(Transform(({ value }) => (value != '' ? value : null)));
  }
  if (options.trim) {
    decorators.push(Transform(({ value }) => (value ? value.trim() : null)));
  }

  return applyDecorators(...decorators);
};
