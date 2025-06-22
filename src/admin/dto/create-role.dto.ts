import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';
import { CreatePermissionDto } from './create-permission.dto';

export class CreateRoleDto {
  @ApiProperty({ required: true })
  @IsCustomString()
  roleName: string;

  @ApiProperty({ type: [CreatePermissionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  permissions?: CreatePermissionDto[];
}
