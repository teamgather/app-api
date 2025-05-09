import { Global, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { UserCacheService } from './services/user.cache.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@teamgather/common/schemas';
import { MemberService } from '../member/services/member.service';

/**
 * ANCHOR User Module
 * @date 08/05/2025 - 12:08:29
 *
 * @export
 * @class UserModule
 * @typedef {UserModule}
 */
@Global()
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
  providers: [UserService, UserCacheService, MemberService],
  exports: [UserService],
})
export class UserModule {}
