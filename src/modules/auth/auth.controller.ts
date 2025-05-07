import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthSignUpBodyDto } from './auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@teamgather/common/schemas';
import { HydratedDocument, Model, QueryWithHelpers } from 'mongoose';
import { AuthService } from './services/auth.service';

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
}
