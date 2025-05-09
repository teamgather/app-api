import { Module } from '@nestjs/common';
import { MemberService } from './services/member.service';

/**
 * ANCHOR Member Module
 * @date 09/05/2025 - 09:56:43
 *
 * @export
 * @class MemberModule
 * @typedef {MemberModule}
 */
@Module({
  providers: [MemberService],
})
export class MemberModule {}
