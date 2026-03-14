import { IGroupRepository } from '../../ports/IGroupRepository';
import { GroupErrors } from '../../../domain/errors/GroupErrors';
import { IAuditLogRepository } from '../../ports/IAuditLogRepository';
import { Result } from '../../../shared/Results';

export class RemoveMemberUseCase {
 
  constructor(
    private readonly groupRepository:    IGroupRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}
 
  async execute(groupId: string, targetEmail: string, requesterEmail: string): Promise<Result<void>> {
    const group = await this.groupRepository.findById(groupId);
    if (!group)                         return Result.fail(GroupErrors.GROUP_NOT_FOUND);
    if (!group.isMember(targetEmail))   return Result.fail(GroupErrors.NOT_MEMBER);
    if (group.isOwner(targetEmail))     return Result.fail(GroupErrors.CANNOT_REMOVE_OWNER);
    if (!group.isAdmin(requesterEmail)) return Result.fail(GroupErrors.NOT_ADMIN);
 
    await this.groupRepository.removeMember(groupId, targetEmail);
 
    await this.auditLogRepository.log({
      action:    'MEMBER_REMOVED',
      userEmail: requesterEmail,
      groupId,
      metadata:  { targetEmail },
    });
 
    return Result.ok(undefined);
  }
}
 
export class PromoteMemberUseCase {
 
  constructor(
    private readonly groupRepository:    IGroupRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}
 
  async execute(groupId: string, targetEmail: string, role: 'admin' | 'member', requesterEmail: string): Promise<Result<void>> {
    const group = await this.groupRepository.findById(groupId);
    if (!group)                          return Result.fail(GroupErrors.GROUP_NOT_FOUND);
    if (!group.isMember(targetEmail))    return Result.fail(GroupErrors.NOT_MEMBER);
    if (group.isOwner(targetEmail))      return Result.fail(GroupErrors.CANNOT_PROMOTE_OWNER);
    if (!group.isOwner(requesterEmail))  return Result.fail(GroupErrors.NOT_OWNER);
 
    await this.groupRepository.updateMemberRole(groupId, targetEmail, role);
 
    await this.auditLogRepository.log({
      action:    'MEMBER_PROMOTED',
      userEmail: requesterEmail,
      groupId,
      metadata:  { targetEmail, newRole: role },
    });
 
    return Result.ok(undefined);
  }
}