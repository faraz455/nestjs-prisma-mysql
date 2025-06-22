import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class UserEntity {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty({ required: false })
  middleName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  birthDateString: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  mobile?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
