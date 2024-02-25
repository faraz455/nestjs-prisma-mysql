import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { RecordsResponseDto } from '../dto/records-response.dto';

type descriptor = {
  type: Type<unknown>;
  status: number;
  description?: string;
};
export const ApiRecordsResponse = ({ type, status, description }: descriptor) =>
  applyDecorators(
    ApiExtraModels(RecordsResponseDto, type),
    ApiResponse({
      status: status,
      description: description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(RecordsResponseDto) },
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
