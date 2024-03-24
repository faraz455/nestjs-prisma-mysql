import { ApiProperty } from '@nestjs/swagger';
import { IsCustomString } from '../../common/decorators/is-custom-string.decorator';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsCustomString({ optional: true })
  @ApiProperty({
    required: true,
    default: '090078601',
  })
  mobile: string;

  @IsCustomString({ optional: true })
  @ApiProperty({
    required: true,
    default: 'Testing@1',
  })
  password: string;

  // @IsCustomString({ optional: true })
  // @ApiProperty({
  //   required: true,
  //   default: '9789KqX7LEoQgbHe/HSiqQ==.I9KhRQF1lFypGalmMsYbjg==',
  // })
  // enc_password: string;
}

export class RefreshTokenDto {
  @IsCustomString({ optional: true })
  @ApiProperty({
    required: true,
  })
  refreshToken: string;
}
