import { Injectable } from '@nestjs/common';
import {
  UserInfoSuffixCache,
  UserItemPrefixCache,
  UserProjectsSuffixCache,
} from '@teamgather/common';
import { CacheService } from 'src/services/cache/cache.service';

/**
 * ANCHOR User Cache Service
 * @date 08/05/2025 - 03:53:41
 *
 * @export
 * @class UserCacheService
 * @typedef {UserCacheService}
 */
@Injectable()
export class UserCacheService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * ANCHOR Flush Related Cache
   * @date 08/05/2025 - 03:58:58
   *
   * @async
   * @param {?{ userId?: string }} [payload]
   * @returns {Promise<void>}
   */
  async flushRelatedCache(payload?: { userId?: string }): Promise<void> {
    if (!payload) {
      return;
    }

    if (payload.userId) {
      // item
      await this.flushItemCache({
        userId: payload.userId,
      });
    }
  }

  /**
   * ANCHOR Flush Item Cache
   * @date 08/05/2025 - 03:58:51
   *
   * @async
   * @param {{ userId: string }} payload
   * @returns {Promise<void>}
   */
  async flushItemCache(payload: { userId: string }): Promise<void> {
    await this.flushInfoCache({
      userId: payload.userId,
    });

    await this.flushProjectsCache({
      userId: payload.userId,
    });
  }

  /**
   * ANCHOR Info Cache Key
   * @date 08/05/2025 - 03:58:44
   *
   * @param {{ userId: string }} payload
   * @returns {string}
   */
  infoCacheKey(payload: { userId: string }): string {
    return this.cacheService.key(
      UserItemPrefixCache,
      payload.userId,
      UserInfoSuffixCache,
    );
  }

  /**
   * ANCHOR Flush Info Cache
   * @date 08/05/2025 - 03:58:37
   *
   * @async
   * @param {{ userId: string }} payload
   * @returns {Promise<void>}
   */
  async flushInfoCache(payload: { userId: string }): Promise<void> {
    const cacheKey: string = this.infoCacheKey({
      userId: payload.userId,
    });

    await this.cacheService.manager.del(cacheKey);
  }

  /**
   * ANCHOR Projects Cache Key
   * @date 09/05/2025 - 15:38:12
   *
   * @param {{ userId: string }} payload
   * @returns {string}
   */
  projectsCacheKey(payload: { userId: string }): string {
    return this.cacheService.key(
      UserItemPrefixCache,
      payload.userId,
      UserProjectsSuffixCache,
    );
  }

  /**
   * ANCHOR Flush Projects Cache
   * @date 09/05/2025 - 15:38:58
   *
   * @async
   * @param {{ userId: string }} payload
   * @returns {Promise<void>}
   */
  async flushProjectsCache(payload: { userId: string }): Promise<void> {
    const cacheKey: string = this.projectsCacheKey({
      userId: payload.userId,
    });

    await this.cacheService.manager.del(cacheKey);
  }
}
