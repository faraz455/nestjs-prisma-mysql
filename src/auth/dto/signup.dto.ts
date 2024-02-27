import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    required: true,
    example: 'username',
    description: 'The username of the User',
  })
  @IsString()
  username: string;

  @ApiProperty({ required: true })
  @IsString()
  password: string;

  @ApiProperty({
    required: true,
    example: 'firstName',
    description: 'The firstName of the User',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    required: false,
    example: 'middleName',
    description: 'The middleName of the User',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    required: false,
    example: 'lastName',
    description: 'The lastName of the User',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    required: false,
    example: 'gender',
    description: 'The gender of the User',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ required: false })
  @IsString()
  birthDateString: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  mobile: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsOptional()
  address: string;
}
