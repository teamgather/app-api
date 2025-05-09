import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

/**
 * ANCHOR Project Create Body Dto
 * @date 09/05/2025 - 11:48:06
 *
 * @export
 * @class ProjectCreateBodyDto
 * @typedef {ProjectCreateBodyDto}
 */
export class ProjectCreateBodyDto {
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
 * ANCHOR Project Name Body Dto
 * @date 09/05/2025 - 12:49:05
 *
 * @export
 * @class ProjectNameBodyDto
 * @typedef {ProjectNameBodyDto}
 */
export class ProjectNameBodyDto {
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => (value as string).trim())
  name: string;
}
