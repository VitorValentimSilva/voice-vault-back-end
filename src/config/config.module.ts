import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvService } from '@/config/env/env.service';
import { envValidationSchema } from '@/config/env/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationSchema: envValidationSchema,
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class AppConfigModule {}
