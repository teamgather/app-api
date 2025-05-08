import moment from 'moment-timezone';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthSignInBodyDto, AuthSignUpBodyDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@teamgather/common/schemas';
import { HydratedDocument, Model, QueryWithHelpers } from 'mongoose';
import { AuthService } from './services/auth.service';
import { Request, Response } from 'express';
import { AUTH_ACCESS_TOKEN_COOKIE_EXPIRES_DURATION_CONSTANT } from 'src/constants/auth.constant';
import { Public } from 'src/decorators/public.decorator';
import { AuthUserInterface } from '@teamgather/common';
import { UserCacheService } from '../user/services/user.cache.service';

/**
 * ANCHOR Auth Controller
 * @date 07/05/2025 - 19:14:12
 *
 * @export
 * @class AuthController
 * @typedef {AuthController}
 */
@Controller('auth')
export class AuthController {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly authService: AuthService,
    private readonly userCacheService: UserCacheService,
  ) {}

  /**
   * ANCHOR Sign Out
   * @date 08/05/2025 - 07:42:20
   *
   * @async
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response<[]>>}
   */
  @Get('signout')
  @Public()
  async signOut(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<[]>> {
    if (req.user) {
      // auth
      const auth: AuthUserInterface = req.user;

      // remove cache
      await this.userCacheService.flushRelatedCache({
        userId: auth.userId,
      });
    }

    // clear cookie
    res.clearCookie(process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME, {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      path: '/',
    });

    return res.json([]);
  }

  /**
   * ANCHOR Sign Up
   * @date 08/05/2025 - 08:32:45
   *
   * @async
   * @param {Response} res
   * @param {AuthSignUpBodyDto} body
   * @returns {Promise<Response<[]>>}
   */
  @Post('signup')
  @Public()
  async signUp(
    @Res() res: Response,
    @Body() body: AuthSignUpBodyDto,
  ): Promise<Response<[]>> {
    // check exists email address
    const existsEmailQuery: QueryWithHelpers<
      HydratedDocument<UserDocument> | null,
      HydratedDocument<UserDocument>
    > = this.userModel.findOne({
      email: {
        $regex: '^' + body.email + '$',
        $options: 'i',
      },
    });

    const existsEmail: UserDocument | null = await existsEmailQuery.exec();

    if (existsEmail) {
      throw new BadRequestException({
        eMessage: 'This email address is not available.',
      });
    }

    // password
    const password: string = await this.authService.password(body.password);

    // create user
    const user: UserDocument = await this.userModel.create({
      name: body.name,
      email: body.email,
      password,
    });

    const userId: string = user._id.toString();

    // access token
    const accessToken: string = this.authService.accessToken({
      userId,
    });

    // set cookie
    res.cookie(process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      signed: true,
      expires: moment()
        .add(AUTH_ACCESS_TOKEN_COOKIE_EXPIRES_DURATION_CONSTANT, 'd')
        .toDate(),
      path: '/',
    });

    return res.json([]);
  }

  /**
   * ANCHOR Sign In
   * @date 08/05/2025 - 04:18:01
   *
   * @async
   * @param {Response} res
   * @param {AuthSignInBodyDto} body
   * @returns {Promise<Response<[]>>}
   */
  @Post('signin')
  @Public()
  async signIn(
    @Res() res: Response,
    @Body() body: AuthSignInBodyDto,
  ): Promise<Response<[]>> {
    // user
    const userQuery: QueryWithHelpers<
      HydratedDocument<UserDocument> | null,
      HydratedDocument<UserDocument>
    > = this.userModel.findOne({
      email: {
        $regex: '^' + body.email + '$',
        $options: 'i',
      },
    });

    const user: UserDocument | null = await userQuery.exec();

    if (!user) {
      throw new NotFoundException({
        eMessage:
          'Your account information was not found\nor your password is incorrect.',
      });
    }

    const userId: string = user._id.toString();

    // verify password
    const isVerified: boolean = await this.authService.verifyPassword(
      body.password,
      user.password,
    );

    if (!isVerified) {
      throw new NotFoundException({
        eMessage:
          'Your account information was not found\nor your password is incorrect.',
      });
    }

    // access token
    const accessToken: string = this.authService.accessToken({
      userId,
    });

    // set cookie
    res.cookie(process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      signed: true,
      expires: moment()
        .add(AUTH_ACCESS_TOKEN_COOKIE_EXPIRES_DURATION_CONSTANT, 'd')
        .toDate(),
      path: '/',
    });

    return res.json([]);
  }
}
