import { ApiProperty } from '@nestjs/swagger';

export class RoleEntity {
  @ApiProperty()
  roleId: string;

  @ApiProperty()
  roleName: string;
}
