import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './services/project.service';
import { ProjectCacheService } from './services/project.cache.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Project,
  ProjectSchema,
  User,
  UserSchema,
} from '@teamgather/common/schemas';
import { MemberService } from '../member/services/member.service';
import { UserCacheService } from '../user/services/user.cache.service';

/**
 * ANCHOR Project Module
 * @date 08/05/2025 - 11:56:53
 *
 * @export
 * @class ProjectModule
 * @typedef {ProjectModule}
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectCacheService,
    MemberService,
    UserCacheService,
  ],
})
export class ProjectModule {}
