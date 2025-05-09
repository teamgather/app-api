import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MemberModel, UserModel } from '@teamgather/common';
import { User, UserDocument } from '@teamgather/common/schemas';
import {
  ClientSession,
  HydratedDocument,
  Model,
  PopulateOptions,
  QueryWithHelpers,
} from 'mongoose';
import { UserCacheService } from './user.cache.service';
import { CacheService } from 'src/services/cache/cache.service';
import { MemberService } from 'src/modules/member/services/member.service';

/**
 * ANCHOR User Service
 * @date 08/05/2025 - 03:59:06
 *
 * @export
 * @class UserService
 * @typedef {UserService}
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly userCacheService: UserCacheService,
    private readonly cacheService: CacheService,
    private readonly memberService: MemberService,
  ) {}

  /**
   * ANCHOR User
   * @date 08/05/2025 - 05:13:50
   *
   * @async
   * @param {{
   *     userId: string;
   *     session?: ClientSession;
   *     populate?: string[] | PopulateOptions | Array<PopulateOptions>;
   *   }} payload
   * @returns {Promise<UserDocument | null>}
   */
  async user(payload: {
    userId: string;
    session?: ClientSession;
    populate?: string[] | PopulateOptions | Array<PopulateOptions>;
  }): Promise<UserDocument | null> {
    // user
    const userQuery: QueryWithHelpers<
      HydratedDocument<UserDocument> | null,
      HydratedDocument<UserDocument>
    > = this.userModel
      .findById(payload.userId, null, {
        session: payload.session,
      })
      .populate(payload.populate || []);

    const user: UserDocument | null = await userQuery.exec();

    return user || null;
  }

  /**
   * ANCHOR Info
   * @date 08/05/2025 - 05:16:26
   *
   * @async
   * @param {{
   *     userId: string;
   *     user?: UserDocument;
   *   }} payload
   * @returns {Promise<UserModel | null>}
   */
  async info(payload: {
    userId: string;
    user?: UserDocument;
  }): Promise<UserModel | null> {
    // cache key
    const cacheKey: string = this.userCacheService.infoCacheKey({
      userId: payload.userId,
    });

    // info
    let info: UserModel | null =
      await this.cacheService.manager.get<UserModel>(cacheKey);

    if (!info) {
      // user
      if (payload.user) {
        info = this.model({
          user: payload.user,
        });
      }
      // fetch user
      else {
        const user: UserDocument | null = await this.user({
          userId: payload.userId,
        });

        if (user) {
          info = this.model({
            user,
          });
        }
      }

      // store
      if (info) {
        await this.cacheService.manager.set(cacheKey, info);
      }
    }

    return info || null;
  }

  /**
   * ANCHOR Model
   * @date 08/05/2025 - 04:10:18
   *
   * @param {{ user: UserDocument }} payload
   * @returns {UserModel}
   */
  model(payload: { user: UserDocument }): UserModel {
    // user
    const user: UserDocument = payload.user;

    // id
    const id: string = user._id.toString();

    // members
    const members: MemberModel[] = [];

    for (const userMember of user.members) {
      const member: MemberModel = this.memberService.model({
        member: userMember,
      });

      members.push(member);
    }

    // model
    const model: UserModel = {
      id,
      name: user.name,
      email: user.email,
      members,
    };

    return model;
  }
}
