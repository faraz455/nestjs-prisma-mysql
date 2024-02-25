import { ApiProperty } from '@nestjs/swagger';

export class DataResponseDto<T> {
  data: T[];
}
