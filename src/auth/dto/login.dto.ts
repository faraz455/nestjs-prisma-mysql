import { ApiProperty } from '@nestjs/swagger';
import { IsChiString } from '../../common/decorators/is-chi-string.decorator';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsChiString({ optional: true })
  @ApiProperty({
    required: false,
    default: '090078601',
  })
  mobile: string;

  @IsChiString({ optional: true })
  @ApiProperty({
    required: false,
    default: 'Testing@1',
  })
  password: string;

  @IsChiString({ optional: true })
  @ApiProperty({
    required: false,
    default: '9789KqX7LEoQgbHe/HSiqQ==.I9KhRQF1lFypGalmMsYbjg==',
  })
  enc_password: string;

  @IsChiString({ optional: false })
  @ApiProperty({ required: true })
  fcmToken: string;

  @IsString()
  @ApiProperty({
    required: true,
  })
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  deviceName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  deviceModel?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  deviceType?: string;

  @ApiProperty({
    required: true,
    example: '18000',
    description: 'This is time zone where user login',
  })
  @IsOptional()
  @IsNumber()
  tzOffset?: number;
}
