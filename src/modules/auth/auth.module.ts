import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@teamgather/common/schemas';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_ACCESS_TOKEN_JWT_EXPIRES_IN_CONSTANT } from 'src/constants/auth.constant';

/**
 * ANCHOR Auth Module
 * @date 07/05/2025 - 19:19:43
 *
 * @export
 * @class AuthModule
 * @typedef {AuthModule}
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    JwtModule.register({
      secretOrKeyProvider: () => {
        return process.env.JWT_SECRET_KEY;
      },
      signOptions: {
        expiresIn: AUTH_ACCESS_TOKEN_JWT_EXPIRES_IN_CONSTANT,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
