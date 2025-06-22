import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { CreatePermissionDto } from './create-permission.dto';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiProperty({ type: [CreatePermissionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  @IsOptional()
  permissions?: CreatePermissionDto[];
}
