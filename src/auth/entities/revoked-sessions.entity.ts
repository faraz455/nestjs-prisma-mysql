import { ApiProperty } from '@nestjs/swagger';

export class RevokedSessionsEntity {
  @ApiProperty({ required: true })
  userId: string;

  @ApiProperty({ required: true, type: Number })
  revoked: number;
}
