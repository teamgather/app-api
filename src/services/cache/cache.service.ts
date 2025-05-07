import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

/**
 * ANCHOR Cache Service
 * @date 08/05/2025 - 03:52:44
 *
 * @export
 * @class CacheService
 * @typedef {CacheService}
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * ANCHOR Manager
   * @date 08/05/2025 - 03:52:06
   *
   * @readonly
   * @type {Cache}
   */
  get manager(): Cache {
    return this.cacheManager;
  }

  /**
   * ANCHOR Key
   * @date 08/05/2025 - 03:52:12
   *
   * @param {...string[]} paths
   * @returns {string}
   */
  key(...paths: string[]): string {
    const path: string = paths.join(':').replace(/:+/g, ':');

    return path;
  }

  /**
   * ANCHOR Prefix
   * @date 08/05/2025 - 03:52:18
   *
   * @param {...string[]} paths
   * @returns {string}
   */
  prefix(...paths: string[]): string {
    const key: string = this.key(...paths);
    const prefix: string = `${key}:*`.replace(/:+/g, ':');

    return prefix;
  }
}
