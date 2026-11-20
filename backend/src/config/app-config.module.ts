import { Global, Module } from '@nestjs/common';
import { validateEnv } from './env.js';

export const APP_ENV = Symbol('APP_ENV');

@Global()
@Module({
  providers: [{ provide: APP_ENV, useFactory: () => validateEnv(process.env) }],
  exports: [APP_ENV],
})
export class AppConfigModule {}
