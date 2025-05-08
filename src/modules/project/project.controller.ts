import {
  Body,
  Controller,
  ForbiddenException,
  InternalServerErrorException,
  Post,
  Req,
} from '@nestjs/common';
import { ProjectFormBodyDto } from './project.dto';
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
import { AuthUserInterface, MemberRoleEnum } from '@teamgather/common';

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
  ) {}

  /**
   * ANCHOR Create
   * @date 08/05/2025 - 12:31:43
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
        project,
        projectName: project.name,
        user,
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
}
