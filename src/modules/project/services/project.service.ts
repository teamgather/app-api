import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from '@teamgather/common/schemas';
import {
  ClientSession,
  HydratedDocument,
  Model,
  PopulateOptions,
  QueryWithHelpers,
} from 'mongoose';
import { CacheService } from 'src/services/cache/cache.service';
import { ProjectCacheService } from './project.cache.service';
import { MemberModel, ProjectModel, UserModel } from '@teamgather/common';
import { MemberService } from 'src/modules/member/services/member.service';

/**
 * ANCHOR Project Service
 * @date 09/05/2025 - 09:06:41
 *
 * @export
 * @class ProjectService
 * @typedef {ProjectService}
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly projectCacheService: ProjectCacheService,
    private readonly cacheService: CacheService,
    private readonly memberService: MemberService,
  ) {}

  /**
   * ANCHOR Project
   * @date 09/05/2025 - 09:08:59
   *
   * @async
   * @param {{
   *     projectId: string;
   *     session?: ClientSession;
   *     populate?: string[] | PopulateOptions | Array<PopulateOptions>;
   *   }} payload
   * @returns {Promise<ProjectDocument | null>}
   */
  async project(payload: {
    projectId: string;
    session?: ClientSession;
    populate?: string[] | PopulateOptions | Array<PopulateOptions>;
  }): Promise<ProjectDocument | null> {
    // project
    const projectQuery: QueryWithHelpers<
      HydratedDocument<ProjectDocument> | null,
      HydratedDocument<ProjectDocument>
    > = this.projectModel
      .findById(payload.projectId, null, {
        session: payload.session,
      })
      .populate(payload.populate || []);

    const project: ProjectDocument | null = await projectQuery.exec();

    return project || null;
  }

  /**
   * ANCHOR Info
   * @date 09/05/2025 - 09:10:18
   *
   * @async
   * @param {{
   *     projectId: string;
   *     project?: ProjectDocument;
   *   }} payload
   * @returns {Promise<ProjectModel | null>}
   */
  async info(payload: {
    projectId: string;
    project?: ProjectDocument;
  }): Promise<ProjectModel | null> {
    // cache key
    const cacheKey: string = this.projectCacheService.infoCacheKey({
      projectId: payload.projectId,
    });

    // info
    let info: ProjectModel | null =
      await this.cacheService.manager.get<ProjectModel>(cacheKey);

    if (!info) {
      // project
      if (payload.project) {
        info = this.model({
          project: payload.project,
        });
      }
      // fetch project
      else {
        const project: ProjectDocument | null = await this.project({
          projectId: payload.projectId,
        });

        if (project) {
          info = this.model({
            project,
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
   * @date 09/05/2025 - 09:10:51
   *
   * @param {{ project: ProjectDocument }} payload
   * @returns {ProjectModel}
   */
  model(payload: { project: ProjectDocument }): ProjectModel {
    // project
    const project: ProjectDocument = payload.project;

    // id
    const id: string = project._id.toString();

    // members
    const members: MemberModel[] = [];

    for (const projectMember of project.members) {
      const member: MemberModel = this.memberService.model({
        member: projectMember,
      });

      members.push(member);
    }

    // model
    const model: ProjectModel = {
      id,
      name: project.name,
      description: project.description,
      members,
    };

    return model;
  }

  /**
   * ANCHOR Member
   * @date 09/05/2025 - 11:32:28
   *
   * @param {{
   *     project: ProjectModel;
   *     user: UserModel;
   *   }} payload
   * @returns {(MemberModel | null)}
   */
  member(payload: {
    project: ProjectModel;
    user: UserModel;
  }): MemberModel | null {
    // project member
    const projectMember: MemberModel | undefined = payload.project.members.find(
      (e) => {
        return e.userId == payload.user.id;
      },
    );

    if (!projectMember) {
      return null;
    }

    // user member
    const userMember: MemberModel | undefined = payload.user.members.find(
      (e) => {
        return e.projectId == payload.project.id;
      },
    );

    if (!userMember) {
      return null;
    }

    // match
    if (projectMember.id != userMember.id) {
      return null;
    }

    return projectMember;
  }
}
