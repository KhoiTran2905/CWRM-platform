import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_ENV } from '../config/app-config.module.js';
import type { AppEnv } from '../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [APP_ENV],
      useFactory: (config: AppEnv) => ({
        secret: config.jwtSecret,
        signOptions: { algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
