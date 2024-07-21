import { ApiProperty } from '@nestjs/swagger';
import { IsCustomString } from '../../common/decorators/is-custom-string.decorator';

export class LoginDto {
  @ApiProperty({
    required: true,
    default: 'username123',
  })
  @IsCustomString()
  username: string;

  @ApiProperty({
    required: true,
    default: 'password',
  })
  @IsCustomString()
  password: string;

  // @IsCustomString({ optional: true })
  // @ApiProperty({
  //   required: true,
  //   default: '9789KqX7LEoQgbHe/HSiqQ==.I9KhRQF1lFypGalmMsYbjg==',
  // })
  // enc_password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    required: true,
  })
  @IsCustomString()
  refreshToken: string;
}
