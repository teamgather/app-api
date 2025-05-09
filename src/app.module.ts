import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvInterface } from './interfaces/common.interface';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CACHE_TTL_CONSTANT } from '@teamgather/common';
import { CacheService } from './services/cache/cache.service';
import { ProjectModule } from './modules/project/project.module';
import { MemberModule } from './modules/member/member.module';

/**
 * ANCHOR App Module
 * @date 07/05/2025 - 16:20:50
 *
 * @export
 * @class AppModule
 * @typedef {AppModule}
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvInterface>) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    CacheModule.register({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        ttl: CACHE_TTL_CONSTANT,
      }),
    }),
    UserModule,
    AuthModule,
    ProjectModule,
    MemberModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
  exports: [AppService, CacheService],
})
export class AppModule {}
