import { Injectable } from '@nestjs/common';
import { MemberModel } from '@teamgather/common';
import { Member } from '@teamgather/common/schemas';

/**
 * ANCHOR Member Service
 * @date 09/05/2025 - 09:56:52
 *
 * @export
 * @class MemberService
 * @typedef {MemberService}
 */
@Injectable()
export class MemberService {
  /**
   * ANCHOR Model
   * @date 09/05/2025 - 09:58:47
   *
   * @param {{ member: Member }} payload
   * @returns {MemberModel}
   */
  model(payload: { member: Member }): MemberModel {
    // member
    const member: Member = payload.member;

    // model
    const model: MemberModel = {
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      userName: member.userName,
      userEmail: member.userEmail,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    };

    return model;
  }
}
