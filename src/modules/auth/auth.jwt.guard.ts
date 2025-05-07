import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * ANCHOR Auth Jwt Guard
 * @date 08/05/2025 - 04:40:41
 *
 * @export
 * @class AuthJwtGuard
 * @typedef {AuthJwtGuard}
 * @extends {AuthGuard('jwt')}
 */
@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * ANCHOR Can Activate
   * @date 08/05/2025 - 04:40:48
   *
   * @param {ExecutionContext} context
   * @returns {(boolean | Promise<boolean> | Observable<boolean>)}
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
