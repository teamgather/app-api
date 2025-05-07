import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ObjectId } from 'mongodb';
import {
  AuthAccessTokenInterface,
  AuthUserInterface,
  UserModel,
} from '@teamgather/common';
import { UserService } from '../user/services/user.service';
import { signedCookie } from 'cookie-parser';

/**
 * ANCHOR Token Extractor
 * @date 08/05/2025 - 04:43:25
 *
 * @param {Request} req
 * @returns {(string | null)}
 */
const TokenExtractor = function (req: Request): string | null {
  // access token
  let accessToken: string | null = null;

  // data
  let data: string | false = false;

  if (req.cookies[process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME]) {
    accessToken = req.cookies[
      process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME
    ] as string;
  } else if (req.signedCookies[process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME]) {
    accessToken = req.signedCookies[
      process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME
    ] as string;

    data = accessToken;
  } else if (req.headers['authorization']) {
    const authorization: string[] = req.headers['authorization'].split(' ');

    if (authorization.length == 2 && authorization[0] == 'Bearer') {
      accessToken = authorization[1];
    }
  }

  if (accessToken) {
    // data
    if (!data) {
      data = signedCookie(accessToken, process.env.COOKIE_SECRET_KEY);
    }

    if (data) {
      return data;
    }
  }

  return null;
};

/**
 * ANCHOR Auth Jwt Strategy
 * @date 08/05/2025 - 05:05:56
 *
 * @export
 * @class AuthJwtStrategy
 * @typedef {AuthJwtStrategy}
 * @extends {PassportStrategy(Strategy)}
 */
@Injectable()
export class AuthJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
      jwtFromRequest: ExtractJwt.fromExtractors([TokenExtractor]),
    });
  }

  /**
   * ANCHOR Validate
   * @date 08/05/2025 - 05:05:26
   *
   * @async
   * @param {AuthAccessTokenInterface} payload
   * @returns {Promise<AuthUserInterface>}
   */
  async validate(
    payload: AuthAccessTokenInterface,
  ): Promise<AuthUserInterface> {
    if (typeof payload.userId == 'string' && ObjectId.isValid(payload.userId)) {
      // user
      const user: UserModel | null = await this.userService.info({
        userId: payload.userId,
      });

      if (user) {
        // auth
        const auth: AuthUserInterface = {
          userId: user.id,
        };

        return auth;
      }
    }

    throw new UnauthorizedException();
  }
}
