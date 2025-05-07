import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsStrongPassword, Length } from 'class-validator';

/**
 * ANCHOR Auth Sign In Body Dto
 * @date 08/05/2025 - 01:44:19
 *
 * @export
 * @class AuthSignInBodyDto
 * @typedef {AuthSignInBodyDto}
 */
export class AuthSignInBodyDto {
  @IsString()
  @IsEmail()
  @Length(1, 300)
  @Transform(({ value }) => (value as string).trim())
  email: string;

  @IsString()
  @Length(8, 1000)
  password: string;
}

/**
 * ANCHOR Auth Sign Up Body Dto
 * @date 07/05/2025 - 19:15:23
 *
 * @export
 * @class AuthSignUpBodyDto
 * @typedef {AuthSignUpBodyDto}
 */
export class AuthSignUpBodyDto {
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => (value as string).trim())
  name: string;

  @IsString()
  @IsEmail()
  @Length(1, 300)
  @Transform(({ value }) => (value as string).trim())
  email: string;

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Length(8, 1000)
  password: string;
}
