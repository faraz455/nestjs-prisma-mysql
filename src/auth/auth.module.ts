import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';

import { EnvironmentVars } from 'src/common/common.types';

@Module({
  providers: [AuthService, JwtStrategy],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(EnvironmentVars.JWT_SECRET),
        signOptions: { expiresIn: '86400s' },
      }),
    }),
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
