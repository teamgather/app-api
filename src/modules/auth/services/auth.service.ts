import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcrypt';

/**
 * ANCHOR Auth Service
 * @date 08/05/2025 - 01:32:23
 *
 * @export
 * @class AuthService
 * @typedef {AuthService}
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * ANCHOR Password
   * @date 08/05/2025 - 01:34:26
   *
   * @async
   * @param {string} password
   * @returns {Promise<string>}
   */
  async password(password: string): Promise<string> {
    const salt: string = await genSalt();
    const hashed: string = await hash(password, salt);

    return hashed;
  }

  /**
   * ANCHOR Verify Password
   * @date 08/05/2025 - 02:41:15
   *
   * @async
   * @param {string} password
   * @param {string} encrypted
   * @returns {Promise<boolean>}
   */
  async verifyPassword(password: string, encrypted: string): Promise<boolean> {
    return await compare(password, encrypted);
  }

  /**
   * ANCHOR Access Token
   * @date 08/05/2025 - 02:25:01
   *
   * @param {{ userId: string }} payload
   * @returns {string}
   */
  accessToken(payload: { userId: string }): string {
    return this.jwtService.sign(payload);
  }
}
