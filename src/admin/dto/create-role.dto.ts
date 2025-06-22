import { ApiProperty } from '@nestjs/swagger';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';

export class CreateRoleDto {
  @ApiProperty({ required: true })
  @IsCustomString()
  roleName: string;
}
