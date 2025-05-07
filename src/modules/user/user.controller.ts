import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthUserInterface, UserModel } from '@teamgather/common';
import { Request } from 'express';
import { UserService } from './services/user.service';

/**
 * ANCHOR User Controller
 * @date 08/05/2025 - 04:19:11
 *
 * @export
 * @class UserController
 * @typedef {UserController}
 */
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * ANCHOR Me
   * @date 08/05/2025 - 05:25:50
   *
   * @async
   * @param {Request} req
   * @returns {Promise<{
   *     user: UserModel;
   *   }>}
   */
  @Get('me')
  async me(@Req() req: Request): Promise<{
    user: UserModel;
  }> {
    // auth
    const auth: AuthUserInterface = req.user;

    // user
    const user: UserModel | null = await this.userService.info({
      userId: auth.userId,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user,
    };
  }
}
