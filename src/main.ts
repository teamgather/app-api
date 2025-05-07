import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import chalk from 'chalk';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { EnvInterface } from './interfaces/common.interface';
import {
  json as bodyParserJson,
  urlencoded as bodyParserUrlencoded,
} from 'body-parser';
import { AuthJwtGuard } from './modules/auth/auth.jwt.guard';
import { AuthUserInterface } from '@teamgather/common';

const APP = 'APP API';
const PORT = 5100;

/**
 * ANCHOR Bootstrap
 * @date 07/05/2025 - 16:07:16
 *
 * @async
 * @returns {*}
 */
async function bootstrap() {
  // create app
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn'],
      cors: {
        origin: (process.env.CORS_WHITELIST || '').split(','),
        credentials: true,
      },
    });

  // trust proxy
  app.set('trust proxy', 1);

  // body parser
  app.use(
    bodyParserJson({
      limit: '12MB',
    }),
  );

  app.use(
    bodyParserUrlencoded({
      extended: true,
      limit: '12MB',
    }),
  );

  // cookie parser
  app.use(cookieParser(process.env.COOKIE_SECRET_KEY));

  // helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  // validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      disableErrorMessages: process.env.NODE_ENV == 'production',
    }),
  );

  // reflector
  const reflector = app.get(Reflector);

  // auth jwt
  app.useGlobalGuards(new AuthJwtGuard(reflector));

  // shutdown hooks
  app.enableShutdownHooks();

  // start app
  await app.listen(PORT, '0.0.0.0', () => {
    // messages
    let messages: string[] = [];

    if (process.env.NODE_ENV == 'production') {
      messages = [
        chalk.magenta(APP),
        chalk.green('IS RUNNING ON PORT:'),
        chalk.yellow(PORT),
      ];
    } else {
      messages = [
        chalk.magenta(APP),
        chalk.green('IS RUNNING ON:'),
        chalk.yellow(`http://localhost:${PORT}`),
      ];
    }

    console.log(...messages);
  });
}

// run app
bootstrap();

// global
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvInterface {
      NODE_ENV: 'test' | 'development' | 'production';
    }
  }
}

// express
declare module 'express' {
  interface Request {
    user: AuthUserInterface;
  }
}
