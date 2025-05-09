import { Injectable } from '@nestjs/common';
import {
  ProjectInfoSuffixCache,
  ProjectItemPrefixCache,
} from '@teamgather/common';
import { CacheService } from 'src/services/cache/cache.service';

/**
 * ANCHOR Project Cache Service
 * @date 09/05/2025 - 08:46:51
 *
 * @export
 * @class ProjectCacheService
 * @typedef {ProjectCacheService}
 */
@Injectable()
export class ProjectCacheService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * ANCHOR Flush Related Cache
   * @date 09/05/2025 - 08:47:10
   *
   * @async
   * @param {?{ projectId?: string }} [payload]
   * @returns {Promise<void>}
   */
  async flushRelatedCache(payload?: { projectId?: string }): Promise<void> {
    if (!payload) {
      return;
    }

    if (payload.projectId) {
      // item
      await this.flushItemCache({
        projectId: payload.projectId,
      });
    }
  }

  /**
   * ANCHOR Flush Item Cache
   * @date 09/05/2025 - 08:48:30
   *
   * @async
   * @param {{ projectId: string }} payload
   * @returns {Promise<void>}
   */
  async flushItemCache(payload: { projectId: string }): Promise<void> {
    await this.flushInfoCache({
      projectId: payload.projectId,
    });
  }

  /**
   * ANCHOR Info Cache Key
   * @date 09/05/2025 - 08:48:57
   *
   * @param {{ projectId: string }} payload
   * @returns {string}
   */
  infoCacheKey(payload: { projectId: string }): string {
    return this.cacheService.key(
      ProjectItemPrefixCache,
      payload.projectId,
      ProjectInfoSuffixCache,
    );
  }

  /**
   * ANCHOR Flush Info Cache
   * @date 09/05/2025 - 08:49:09
   *
   * @async
   * @param {{ projectId: string }} payload
   * @returns {Promise<void>}
   */
  async flushInfoCache(payload: { projectId: string }): Promise<void> {
    const cacheKey: string = this.infoCacheKey({
      projectId: payload.projectId,
    });

    await this.cacheService.manager.del(cacheKey);
  }
}
