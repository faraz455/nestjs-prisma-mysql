import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { IsCustomString } from 'src/common/decorators/is-custom-string.decorator';
import { ResourceName } from 'src/auth/dto';

export class CreatePermissionDto {
  @ApiProperty({ enum: ResourceName })
  @IsEnum(ResourceName)
  resourceName: ResourceName;

  @ApiProperty({ required: true })
  @IsCustomString()
  roleId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  view?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  update?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}
