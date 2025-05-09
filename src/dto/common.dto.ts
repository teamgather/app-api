import { IsMongoId, IsString } from 'class-validator';

/**
 * ANCHOR Item Param Dto
 * @date 09/05/2025 - 09:13:21
 *
 * @export
 * @class ItemParamDto
 * @typedef {ItemParamDto}
 */
export class ItemParamDto {
  @IsString()
  @IsMongoId()
  id: string;
}
