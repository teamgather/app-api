import { Injectable } from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';

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
}
