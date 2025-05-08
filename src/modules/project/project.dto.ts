import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

/**
 * ANCHOR Project Form Body Dto
 * @date 08/05/2025 - 11:53:26
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
