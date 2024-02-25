import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const QueryNotRequired = (queries: string[]) =>
  applyDecorators(
    ...queries.map((name: string) => {
      return ApiQuery({
        name: name,
        required: false,
      });
    }),
  );
