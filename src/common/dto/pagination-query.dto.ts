import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsCustomString } from '../decorators/is-custom-string.decorator';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false })
  perPage?: number = 30;

  @IsCustomString({ required: false })
  @ApiProperty({ required: false })
  search?: string = '';
}
