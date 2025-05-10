import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, Length } from 'class-validator';

/**
 * ANCHOR Project Form Body Dto
 * @date 09/05/2025 - 14:51:13
 *
 * @export
 * @class ProjectFormBodyDto
 * @typedef {ProjectFormBodyDto}
 */
export class ProjectFormBodyDto {
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => (value as string).trim())
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Transform(({ value }) => {
    return value ? (value as string).trim() : (value as unknown);
  })
  description?: string;
}

/**
 * ANCHOR Project Member Form Body Dto
 * @date 10/05/2025 - 21:57:28
 *
 * @export
 * @class ProjectMemberFormBodyDto
 * @typedef {ProjectMemberFormBodyDto}
 */
export class ProjectMemberFormBodyDto {
  @IsString()
  @IsMongoId()
  userId: string;
}
