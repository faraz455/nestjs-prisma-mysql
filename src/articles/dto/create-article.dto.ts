import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, MaxLength } from 'class-validator';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';
import { MYSQL_STRING_MAX } from 'src/common/common.types';

export class CreateArticleDto {
  @ApiProperty({
    required: true,
    type: String,
  })
  @MaxLength(MYSQL_STRING_MAX)
  @IsCustomString()
  title: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @MaxLength(MYSQL_STRING_MAX)
  @IsCustomString({ required: false })
  description?: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @MaxLength(MYSQL_STRING_MAX)
  @IsCustomString()
  body: string;

  @ApiProperty({
    required: true,
    type: Boolean,
  })
  @IsBoolean()
  published: boolean;
}
