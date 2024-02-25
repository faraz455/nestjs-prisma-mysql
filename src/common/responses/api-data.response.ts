import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { DataResponseDto } from '../dto/data-response.dto';

type descriptor = {
  type: Type<unknown>;
  status: number;
  description?: string;
};
export const ApiDataResponse = ({ type, status, description }: descriptor) =>
  applyDecorators(
    ApiExtraModels(DataResponseDto, type),
    ApiResponse({
      status: status,
      description: description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(DataResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(type) },
              },
            },
          },
        ],
      },
    }),
  );
