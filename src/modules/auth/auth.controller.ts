import moment from 'moment-timezone';
import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { AuthSignInBodyDto, AuthSignUpBodyDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@teamgather/common/schemas';
import { HydratedDocument, Model, QueryWithHelpers } from 'mongoose';
import { AuthService } from './services/auth.service';
import { Response } from 'express';
import { AUTH_ACCESS_TOKEN_COOKIE_EXPIRES_DURATION_CONSTANT } from 'src/constants/auth.constant';

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
  ) {}

  /**
   * ANCHOR Sign Up
   * @date 08/05/2025 - 01:28:21
   *
   * @async
   * @param {AuthSignUpBodyDto} body
   * @returns {Promise<[]>}
   */
  @Post('signup')
  async signUp(@Body() body: AuthSignUpBodyDto): Promise<[]> {
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

    console.log(user);

    return [];
  }

  /**
   * ANCHOR Sign In
   * @date 08/05/2025 - 02:45:06
   *
   * @async
   * @param {Response} res
   * @param {AuthSignInBodyDto} body
   * @returns {Promise<Response<[]>>}
   */
  @Post('signin')
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
        eMessage: 'Your account information was not found.',
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
        eMessage: 'Your password is incorrect.',
      });
    }

    // access token
    const accessToken: string = this.authService.accessToken({
      userId,
    });

    // response
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
