import { ApiProperty } from '@nestjs/swagger';
import { IsChiString } from '../decorators/is-chi-string.decorator';
import { PaginationQueryDto } from './pagination-query.dto';

export class PaginationQueryExtendedDto extends PaginationQueryDto {
  @IsChiString({ optional: true })
  @ApiProperty({ required: true })
  store_id?: string;
}
