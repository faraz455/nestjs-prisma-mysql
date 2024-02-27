import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SignupDto {
  @ApiProperty({ required: true })
  @IsString()
  email: string;

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
  @IsString()
  lastName?: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  full_name: string;

  constructor(data: SignupDto) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.full_name = `${data.firstName} ${data.lastName || ''}`.trim();
  }
}
