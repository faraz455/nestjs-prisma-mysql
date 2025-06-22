import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsCustomString()
  username: string;

  @ApiProperty({ required: true })
  @IsCustomString()
  password: string;

  @ApiProperty({ required: true })
  @IsCustomString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  middleName?: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  lastName?: string;

  @ApiProperty({ required: true })
  @IsCustomString()
  fullName: string;

  @ApiProperty({ required: true })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ required: true })
  @IsCustomString()
  birthDateString: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  @IsOptional()
  mobile?: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  @IsOptional()
  address?: string;
}
