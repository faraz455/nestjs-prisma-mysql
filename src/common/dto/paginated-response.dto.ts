import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty()
  pages: number;

  records: T[];

  @ApiProperty()
  count: number;
}
