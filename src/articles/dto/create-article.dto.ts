import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { IsChiString } from 'src/common/decorators/is-chi-string.decorator';

export class CreateArticleDto {
  @ApiProperty({
    required: true,
    type: String,
  })
  @IsChiString()
  title: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsChiString({ optional: true })
  description?: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsChiString()
  body: string;

  @ApiProperty({
    required: true,
    type: Boolean,
  })
  @IsBoolean()
  published: boolean;
}
