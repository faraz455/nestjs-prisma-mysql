import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../generated/prisma/client';
import { Profile, ResoucePermissionType } from '../dto';

export class LoginUserEntity {
  @ApiProperty({ required: true })
  userId: string;

  @ApiProperty({ required: true })
  username: string;

  @ApiProperty({ required: true })
  firstName: string;

  @ApiProperty({ required: false })
  middleName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: true })
  fullName: string;

  @ApiProperty({ required: true, enum: Gender })
  gender: Gender;

  @ApiProperty({ required: true })
  birthDateString: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  mobile?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: true })
  createdAt: Date;

  @ApiProperty({ required: true })
  updatedAt: Date;
}

export class LoginEntity {
  @ApiProperty({ required: true, type: LoginUserEntity })
  user: LoginUserEntity;

  @ApiProperty({ required: true, type: Profile })
  profile: Profile;

  @ApiProperty({ required: true, type: Object })
  permissions: ResoucePermissionType;

  @ApiProperty({ required: true })
  authToken: string;

  @ApiProperty({ required: true })
  refreshToken: string;
}
