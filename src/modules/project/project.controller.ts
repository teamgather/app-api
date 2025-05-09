import {
  Body,
  Controller,
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
import { ProjectFormBodyDto } from './project.dto';
import { ProjectCacheService } from './services/project.cache.service';

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
  ) {}

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
        projectName: project.name,
        userId,
        userName: user.name,
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

    const userId: string = user._id.toString();

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

    await this.userCacheService.flushRelatedCache({
      userId,
    });

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
