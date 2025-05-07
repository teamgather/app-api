import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { UserCacheService } from './services/user.cache.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserCacheService],
})
export class UserModule {}
