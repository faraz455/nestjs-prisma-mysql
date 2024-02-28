import { ApiProperty } from '@nestjs/swagger';

export class Profile {
  @ApiProperty({ required: true })
  userId: string;

  @ApiProperty({ required: true, example: 'string' })
  fullName: string;

  @ApiProperty({ required: true, example: 'string' })
  firstName: string;

  @ApiProperty({ required: false, example: 'string or null' })
  middleName: string;

  @ApiProperty({ required: false, example: 'string or null' })
  lastName?: string;

  @ApiProperty({ required: true, example: 'string' })
  mobile: string;

  @ApiProperty({ required: true, example: 'list of roles', isArray: true })
  roles: string[];

  constructor(
    userId: string,
    fullName: string,
    firstName: string,
    middleName: string | null,
    lastName: string | null,
    mobile: string | null,
    roles: string[],
  ) {
    this.userId = userId;
    this.fullName = fullName;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.mobile = mobile;
    this.roles = roles;
  }
}
