import { All, Controller } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

/**
 * ANCHOR App Controller
 * @date 07/05/2025 - 16:19:07
 *
 * @export
 * @class AppController
 * @typedef {AppController}
 */
@Controller()
export class AppController {
  /**
   * ANCHOR Index
   * @date 07/05/2025 - 16:18:57
   *
   * @returns {[]}
   */
  @All()
  @Public()
  index(): [] {
    return [];
  }
}
