import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../generated/prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';
import { IsPassword } from 'src/common/decorators/is-password.decorator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsCustomString()
  username: string;

  @ApiProperty({ required: true })
  @IsPassword()
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

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Array of role IDs to assign to the user',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}
