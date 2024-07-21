import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';

export class SignupDto {
  @ApiProperty({
    required: true,
    example: 'username',
    description: 'The username of the User',
  })
  @IsCustomString()
  username: string;

  @ApiProperty({ required: true })
  @IsCustomString()
  password: string;

  @ApiProperty({
    required: true,
    example: 'firstName',
    description: 'The firstName of the User',
  })
  @IsCustomString()
  firstName: string;

  @ApiProperty({
    required: false,
    example: 'middleName',
    description: 'The middleName of the User',
  })
  @IsCustomString({ required: false })
  middleName?: string;

  @ApiProperty({
    required: false,
    example: 'lastName',
    description: 'The lastName of the User',
  })
  @IsCustomString({ required: false })
  lastName?: string;

  @ApiProperty({
    required: true,
    example: Gender.MALE,
    description: 'The gender of the User',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ required: true })
  @IsCustomString()
  birthDateString: string;

  @ApiProperty({ required: true })
  @IsCustomString()
  email: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  @IsOptional()
  mobile?: string;

  @ApiProperty({ required: false })
  @IsCustomString({ required: false })
  address?: string;
}
