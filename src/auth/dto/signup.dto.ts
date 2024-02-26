import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignupDto {
  @ApiProperty({ required: true })
  @IsString()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  password: string;

  @ApiProperty({ required: true })
  @IsString()
  full_name: string;

  @ApiProperty({ required: true })
  @IsString()
  company_name: string;

  @ApiProperty({ required: true })
  @IsString()
  company_type_id: string;

  @ApiProperty({ required: true })
  @IsString()
  industry_type_id: string;
}
