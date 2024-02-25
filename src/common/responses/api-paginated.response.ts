import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

type descriptor = {
  type: Type<unknown>;
  status: number;
  description?: string;
};
export const ApiPaginatedResponse = ({
  type,
  status,
  description,
}: descriptor) =>
  applyDecorators(
    ApiExtraModels(PaginatedResponseDto, type),
    ApiResponse({
      status: status,
      description: description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              records: {
                type: 'array',
                items: { $ref: getSchemaPath(type) },
              },
            },
          },
        ],
      },
    }),
  );
