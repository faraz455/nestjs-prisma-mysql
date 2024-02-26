import { ApiProperty } from '@nestjs/swagger';

export class ArticleEntity {
  @ApiProperty({
    required: true,
    type: String,
  })
  title: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  description?: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  body: string;

  @ApiProperty({
    required: true,
    type: Boolean,
  })
  published: boolean;

  @ApiProperty({
    required: true,
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    required: true,
    type: Date,
  })
  updatedAt: Date;
}
