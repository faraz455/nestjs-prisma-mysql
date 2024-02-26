import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Profile } from '../dto';

class LoginUserEntity {
  @ApiProperty({
    required: true,
    example: 'userId',
    description: 'The userId of the User',
  })
  userId: string;

  @ApiProperty({
    required: true,
    example: 'password',
    description: 'The password of the User',
  })
  password: string;

  @ApiProperty({
    required: false,
    example: 'MALE',
    enum: Gender,
    description: 'The gender of the User',
  })
  gender?: Gender;

  @ApiProperty({
    required: false,
    example: 101,
    description: 'The birthDate of the User',
  })
  birthDate?: bigint;

  @ApiProperty({
    required: true,
    example: 'mobile',
    description: 'The mobile of the User',
  })
  mobile: string;

  @ApiProperty({
    required: true,
    example: 'firstName',
    description: 'The firstName of the User',
  })
  firstName: string;

  @ApiProperty({
    required: false,
    example: 'lastName',
    description: 'The lastName of the User',
  })
  lastName?: string;

  @ApiProperty({
    required: false,
    example: 'middleName',
    description: 'The middleName of the User',
  })
  middleName?: string;

  @ApiProperty({
    required: false,
    example: 'fullName',
    description: 'The fullName of the User',
  })
  fullName: string;

  @ApiProperty({
    required: true,
    example: 'username',
    description: 'The username of the User',
  })
  username: string;

  @ApiProperty({
    required: false,
    example: 'email',
    description: 'The email of the User',
  })
  email?: string;

  @ApiProperty({
    required: false,
    example: 'title',
    description: 'The title of the User',
  })
  title?: string;

  @ApiProperty({
    required: false,
    example: 101,
    description: 'The height of the User,',
  })
  height?: number;
}

export class LoginEntity {
  @ApiProperty({ required: true, type: LoginUserEntity })
  user: LoginUserEntity;

  @ApiProperty({ required: true, type: Profile })
  profile: Profile;

  @ApiProperty({ required: true, description: 'JWT auth token' })
  auth_token: string;
}
