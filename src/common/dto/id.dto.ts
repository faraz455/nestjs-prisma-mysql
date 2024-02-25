import { ApiProperty } from '@nestjs/swagger';

export class IDDto {
  @ApiProperty({ required: true })
  id: string;
}
