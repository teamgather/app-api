import { EnvNameEnum } from '@teamgather/common';

/**
 * ANCHOR Env Interface
 * @date 07/05/2025 - 16:07:59
 *
 * @export
 * @interface EnvInterface
 * @typedef {EnvInterface}
 */
export interface EnvInterface {
  ENV_NAME: EnvNameEnum;

  MONGODB_URI: string;

  CORS_WHITELIST: string;
  COOKIE_DOMAIN: string;

  APP_URL: string;

  JWT_SECRET_KEY: string;
  COOKIE_SECRET_KEY: string;

  AUTH_ACCESS_TOKEN_COOKIE_NAME: string;
}
