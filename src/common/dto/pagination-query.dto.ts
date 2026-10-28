import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsCustomString } from '../decorators/is-custom-string.decorator';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ required: false })
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ required: false })
  perPage?: number = 30;

  @IsCustomString({ required: false })
  @ApiProperty({ required: false })
  search?: string;
}
