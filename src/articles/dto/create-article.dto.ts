import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';

export class CreateArticleDto {
  @ApiProperty({
    required: true,
    type: String,
  })
  @IsCustomString()
  title: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsCustomString({ required: false })
  description?: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsCustomString()
  body: string;

  @ApiProperty({
    required: true,
    type: Boolean,
  })
  @IsBoolean()
  published: boolean;
}
