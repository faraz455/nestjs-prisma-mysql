import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    type: [String],
    required: false,
    description: 'Array of role IDs to assign to the user',
  })
  @IsOptional()
  roleIds?: string[];
}
