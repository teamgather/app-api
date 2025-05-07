import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { UserCacheService } from './services/user.cache.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@teamgather/common/schemas';

/**
 * ANCHOR User Module
 * @date 08/05/2025 - 05:22:21
 *
 * @export
 * @class UserModule
 * @typedef {UserModule}
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserCacheService],
})
export class UserModule {}
