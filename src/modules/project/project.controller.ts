import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ClientSession,
  Connection,
  DeleteResult,
  HydratedDocument,
  Model,
  QueryWithHelpers,
  UpdateWriteOpResult,
} from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Member,
  Project,
  ProjectDocument,
  User,
  UserDocument,
} from '@teamgather/common/schemas';
import { v1 as uuidv1 } from 'uuid';
import { Request } from 'express';
import { UserService } from '../user/services/user.service';
import {
  AuthUserInterface,
  MemberModel,
  MemberRoleEnum,
  ProjectModel,
  UserModel,
} from '@teamgather/common';
import { ProjectService } from './services/project.service';
import { ItemParamDto } from 'src/dto/common.dto';
import { UserCacheService } from '../user/services/user.cache.service';
import { ProjectFormBodyDto, ProjectMemberFormBodyDto } from './project.dto';
import { ProjectCacheService } from './services/project.cache.service';
import { CacheService } from 'src/services/cache/cache.service';
import { ObjectId } from 'mongodb';

/**
 * ANCHOR Project Controller
 * @date 08/05/2025 - 11:46:13
 *
 * @export
 * @class ProjectController
 * @typedef {ProjectController}
 */
@Controller('project')
export class ProjectController {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly projectService: ProjectService,
    private readonly userCacheService: UserCacheService,
    private readonly projectCacheService: ProjectCacheService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * ANCHOR List
   * @date 09/05/2025 - 15:23:26
   *
   * @async
   * @param {Request} req
   * @returns {Promise<{
   *     projects: ProjectModel[];
   *   }>}
   */
  @Get('list')
  async list(@Req() req: Request): Promise<{
    projects: ProjectModel[];
  }> {
    // auth
    const auth: AuthUserInterface = req.user;

    // user
    const user: UserModel | null = await this.userService.info({
      userId: auth.userId,
    });

    if (!user) {
      throw new ForbiddenException();
    }

    // cache key
    const cacheKey: string = this.userCacheService.projectsCacheKey({
      userId: user.id,
    });

    // projects
    const projects: ProjectModel[] = await this.cacheService.manager.wrap<
      ProjectModel[]
    >(cacheKey, async () => {
      // list
      const list: ProjectModel[] = [];

      // items
      const itemsQuery: QueryWithHelpers<
        HydratedDocument<ProjectDocument>[],
        HydratedDocument<ProjectDocument>
      > = this.projectModel
        .find({
          members: {
            $elemMatch: {
              userId: user.id,
            },
          },
        })
        .sort({
          name: 1,
        });

      const items: ProjectDocument[] = await itemsQuery.exec();

      for (const item of items) {
        // project
        const project: ProjectModel = this.projectService.model({
          project: item,
        });

        list.push(project);
      }

      return list;
    });

    return {
      projects,
    };
  }

  /**
   * ANCHOR Create
   * @date 09/05/2025 - 14:51:51
   *
   * @async
   * @param {Request} req
   * @param {ProjectFormBodyDto} body
   * @returns {Promise<{
   *     id: string;
   *   }>}
   */
  @Post('create')
  async create(
    @Req() req: Request,
    @Body() body: ProjectFormBodyDto,
  ): Promise<{
    id: string;
  }> {
    // session
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    // id
    let id: string | null = null;

    try {
      // auth
      const auth: AuthUserInterface = req.user;

      // user
      const user: UserDocument | null = await this.userService.user({
        userId: auth.userId,
        session,
      });

      if (!user) {
        throw new ForbiddenException();
      }

      const userId: string = user._id.toString();

      // info
      const description: string | null = body.description || null;

      // create project
      const projects: ProjectDocument[] = await this.projectModel.create(
        [
          {
            name: body.name,
            description,
            members: [],
          },
        ],
        {
          session,
        },
      );

      const project: ProjectDocument = projects[0];
      const projectId: string = project._id.toString();

      // now
      const now: Date = new Date();

      // create owner member
      const member: Member = {
        id: uuidv1(),
        projectId,
        userId,
        userName: user.name,
        userEmail: user.email,
        role: MemberRoleEnum.Owner,
        createdAt: now,
        updatedAt: now,
      };

      // update project
      const projectUpdatedQuery: QueryWithHelpers<
        UpdateWriteOpResult,
        ProjectDocument
      > = this.projectModel.updateOne(
        {
          _id: project._id,
        },
        {
          $push: {
            members: member,
          },
        },
        {
          session,
          runValidators: true,
        },
      );

      const projectUpdated: UpdateWriteOpResult =
        await projectUpdatedQuery.exec();

      if (projectUpdated.modifiedCount != 1) {
        throw new InternalServerErrorException();
      }

      // update user
      const userUpdatedQuery: QueryWithHelpers<
        UpdateWriteOpResult,
        UserDocument
      > = this.userModel.updateOne(
        {
          _id: user._id,
        },
        {
          $push: {
            members: member,
          },
        },
        {
          session,
          runValidators: true,
        },
      );

      const userUpdated: UpdateWriteOpResult = await userUpdatedQuery.exec();

      if (userUpdated.modifiedCount != 1) {
        throw new InternalServerErrorException();
      }

      // commit
      await session.commitTransaction();

      // remove cache
      await this.userCacheService.flushRelatedCache({
        userId,
      });

      // id
      id = projectId;
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw e;
    } finally {
      await session.endSession();
    }

    if (!id) {
      throw new InternalServerErrorException();
    }

    return {
      id,
    };
  }

  /**
   * ANCHOR Member Create
   * @date 10/05/2025 - 22:00:42
   *
   * @async
   * @param {Request} req
   * @param {ItemParamDto} param
   * @param {ProjectMemberFormBodyDto} body
   * @returns {Promise<[]>}
   */
  @Post(':id/member/create')
  async memberCreate(
    @Req() req: Request,
    @Param() param: ItemParamDto,
    @Body() body: ProjectMemberFormBodyDto,
  ): Promise<[]> {
    // session
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // auth
      const auth: AuthUserInterface = req.user;

      // user
      const user: UserDocument | null = await this.userService.user({
        userId: auth.userId,
        session,
      });

      if (!user) {
        throw new ForbiddenException();
      }

      // project
      const project: ProjectDocument | null = await this.projectService.project(
        {
          projectId: param.id,
          session,
        },
      );

      if (!project) {
        throw new NotFoundException();
      }

      const projectId: string = project._id.toString();

      // member
      const member: Member | null = this.projectService.memberDoc({
        project,
        user,
      });

      if (!member) {
        throw new ForbiddenException();
      }

      // check is owner
      const isOwnerMember: boolean = this.projectService.isOwnerMember(member);

      if (!isOwnerMember) {
        throw new ForbiddenException();
      }

      // member user
      const memberUser: UserDocument | null = await this.userService.user({
        userId: body.userId,
        session,
      });

      if (!memberUser) {
        throw new NotFoundException({
          eMessage: 'The requested user information was not found.',
        });
      }

      const memberUserId: string = memberUser._id.toString();

      // check already member
      const existsMember: Member | undefined = project.members.find((e) => {
        return e.userId == memberUserId;
      });

      if (existsMember) {
        throw new NotFoundException({
          eMessage: 'This user is already a member of the project.',
        });
      }

      // now
      const now: Date = new Date();

      // create new member
      const newMember: Member = {
        id: uuidv1(),
        projectId,
        userId: memberUserId,
        userName: memberUser.name,
        userEmail: memberUser.email,
        role: MemberRoleEnum.Member,
        createdAt: now,
        updatedAt: now,
      };

      // update project
      const projectUpdatedQuery: QueryWithHelpers<
        UpdateWriteOpResult,
        ProjectDocument
      > = this.projectModel.updateOne(
        {
          _id: project._id,
        },
        {
          $push: {
            members: newMember,
          },
        },
        {
          session,
          runValidators: true,
        },
      );

      const projectUpdated: UpdateWriteOpResult =
        await projectUpdatedQuery.exec();

      if (projectUpdated.modifiedCount != 1) {
        throw new InternalServerErrorException();
      }

      // update user
      const userUpdatedQuery: QueryWithHelpers<
        UpdateWriteOpResult,
        UserDocument
      > = this.userModel.updateOne(
        {
          _id: memberUser._id,
        },
        {
          $push: {
            members: newMember,
          },
        },
        {
          session,
          runValidators: true,
        },
      );

      const userUpdated: UpdateWriteOpResult = await userUpdatedQuery.exec();

      if (userUpdated.modifiedCount != 1) {
        throw new InternalServerErrorException();
      }

      // remove cache
      await this.projectCacheService.flushRelatedCache({
        projectId,
      });

      await this.userCacheService.flushRelatedCache({
        userId: memberUserId,
      });

      for (const member of project.members) {
        await this.userCacheService.flushRelatedCache({
          userId: member.userId,
        });
      }

      // commit
      await session.commitTransaction();
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw e;
    } finally {
      await session.endSession();
    }

    return [];
  }

  /**
   * ANCHOR Users
   * @date 10/05/2025 - 21:23:40
   *
   * @async
   * @param {Request} req
   * @param {ItemParamDto} param
   * @returns {Promise<{
   *     users: UserModel[];
   *   }>}
   */
  @Get(':id/users')
  async users(
    @Req() req: Request,
    @Param() param: ItemParamDto,
  ): Promise<{
    users: UserModel[];
  }> {
    // auth
    const auth: AuthUserInterface = req.user;

    // user
    const user: UserModel | null = await this.userService.info({
      userId: auth.userId,
    });

    if (!user) {
      throw new ForbiddenException();
    }

    // project
    const project: ProjectModel | null = await this.projectService.info({
      projectId: param.id,
    });

    if (!project) {
      throw new NotFoundException();
    }

    // member
    const member: MemberModel | null = this.projectService.member({
      project,
      user,
    });

    if (!member) {
      throw new ForbiddenException();
    }

    // users id
    const usersId: ObjectId[] = project.members.map((e) => {
      return new ObjectId(e.userId);
    });

    // items
    const itemsQuery: QueryWithHelpers<
      HydratedDocument<UserDocument>[],
      HydratedDocument<UserDocument>
    > = this.userModel
      .find({
        _id: {
          $nin: usersId,
        },
      })
      .sort({
        name: 1,
      });

    const items: UserDocument[] = await itemsQuery.exec();

    // users
    const users: UserModel[] = [];

    for (const item of items) {
      // user
      const user: UserModel = this.userService.model({
        user: item,
      });

      users.push(user);
    }

    return {
      users,
    };
  }

  /**
   * ANCHOR Remove
   * @date 10/05/2025 - 18:56:12
   *
   * @async
   * @param {Request} req
   * @param {ItemParamDto} param
   * @returns {Promise<[]>}
   */
  @Delete(':id/remove')
  async remove(@Req() req: Request, @Param() param: ItemParamDto): Promise<[]> {
    // session
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // auth
      const auth: AuthUserInterface = req.user;

      // user
      const user: UserDocument | null = await this.userService.user({
        userId: auth.userId,
        session,
      });

      if (!user) {
        throw new ForbiddenException();
      }

      // project
      const project: ProjectDocument | null = await this.projectService.project(
        {
          projectId: param.id,
          session,
        },
      );

      if (!project) {
        throw new NotFoundException();
      }

      const projectId: string = project._id.toString();

      // member
      const member: Member | null = this.projectService.memberDoc({
        project,
        user,
      });

      if (!member) {
        throw new ForbiddenException();
      }

      // check is owner
      const isOwnerMember: boolean = this.projectService.isOwnerMember(member);

      if (!isOwnerMember) {
        throw new ForbiddenException();
      }

      // delete project
      const projectDeletedQuery: QueryWithHelpers<
        DeleteResult,
        ProjectDocument
      > = this.projectModel.deleteOne(
        {
          _id: project._id,
        },
        {
          session,
        },
      );

      const projectDeleted: DeleteResult = await projectDeletedQuery.exec();

      if (projectDeleted.deletedCount != 1) {
        throw new InternalServerErrorException();
      }

      for (const member of project.members) {
        // update user
        const userUpdatedQuery: QueryWithHelpers<
          UpdateWriteOpResult,
          UserDocument
        > = this.userModel.updateOne(
          {
            _id: new ObjectId(member.userId),
          },
          {
            $pull: {
              members: {
                id: member.id,
              },
            },
          },
          {
            session,
            runValidators: true,
          },
        );

        const userUpdated: UpdateWriteOpResult = await userUpdatedQuery.exec();

        if (userUpdated.modifiedCount != 1) {
          throw new InternalServerErrorException();
        }

        // remove cache
        await this.userCacheService.flushRelatedCache({
          userId: member.userId,
        });
      }

      // remove cache
      await this.projectCacheService.flushRelatedCache({
        projectId,
      });

      // commit
      await session.commitTransaction();
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw e;
    } finally {
      await session.endSession();
    }

    return [];
  }

  /**
   * ANCHOR Update
   * @date 09/05/2025 - 14:52:15
   *
   * @async
   * @param {Request} req
   * @param {ItemParamDto} param
   * @param {ProjectFormBodyDto} body
   * @returns {Promise<[]>}
   */
  @Put(':id/update')
  async update(
    @Req() req: Request,
    @Param() param: ItemParamDto,
    @Body() body: ProjectFormBodyDto,
  ): Promise<[]> {
    // auth
    const auth: AuthUserInterface = req.user;

    // user
    const user: UserDocument | null = await this.userService.user({
      userId: auth.userId,
    });

    if (!user) {
      throw new ForbiddenException();
    }

    // project
    const project: ProjectDocument | null = await this.projectService.project({
      projectId: param.id,
    });

    if (!project) {
      throw new NotFoundException();
    }

    const projectId: string = project._id.toString();

    // member
    const member: Member | null = this.projectService.memberDoc({
      project,
      user,
    });

    if (!member) {
      throw new ForbiddenException();
    }

    // check is owner
    const isOwnerMember: boolean = this.projectService.isOwnerMember(member);

    if (!isOwnerMember) {
      throw new ForbiddenException();
    }

    // info
    const description: string | null = body.description || null;

    // update project
    const projectUpdatedQuery: QueryWithHelpers<
      UpdateWriteOpResult,
      ProjectDocument
    > = this.projectModel.updateOne(
      {
        _id: project._id,
      },
      {
        name: body.name,
        description,
      },
      {
        runValidators: true,
      },
    );

    const projectUpdated: UpdateWriteOpResult =
      await projectUpdatedQuery.exec();

    if (projectUpdated.modifiedCount != 1) {
      throw new InternalServerErrorException();
    }

    // remove cache
    await this.projectCacheService.flushRelatedCache({
      projectId,
    });

    for (const member of project.members) {
      await this.userCacheService.flushRelatedCache({
        userId: member.userId,
      });
    }

    return [];
  }

  /**
   * ANCHOR Info
   * @date 09/05/2025 - 11:33:47
   *
   * @async
   * @param {Request} req
   * @param {ItemParamDto} param
   * @returns {Promise<{
   *     project: ProjectModel;
   *   }>}
   */
  @Get(':id/info')
  async info(
    @Req() req: Request,
    @Param() param: ItemParamDto,
  ): Promise<{
    project: ProjectModel;
  }> {
    // auth
    const auth: AuthUserInterface = req.user;

    // user
    const user: UserModel | null = await this.userService.info({
      userId: auth.userId,
    });

    if (!user) {
      throw new ForbiddenException();
    }

    // project
    const project: ProjectModel | null = await this.projectService.info({
      projectId: param.id,
    });

    if (!project) {
      throw new NotFoundException();
    }

    // member
    const member: MemberModel | null = this.projectService.member({
      project,
      user,
    });

    if (!member) {
      throw new ForbiddenException();
    }

    return {
      project,
    };
  }
}
