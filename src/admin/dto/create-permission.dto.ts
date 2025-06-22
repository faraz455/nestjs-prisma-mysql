import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ResourceName } from 'src/auth/dto';

export class CreatePermissionDto {
  @ApiProperty({ enum: ResourceName })
  @IsEnum(ResourceName)
  resourceName: ResourceName;

  @ApiProperty({ required: true })
  roleId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  create?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  view?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  update?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  delete?: boolean;
}
