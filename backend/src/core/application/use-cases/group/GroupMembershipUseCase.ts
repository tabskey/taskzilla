import { IGroupRepository } from '../../ports/IGroupRepository';
import { IGroupRequestRepository } from '../../ports/IGroupRequestRepository';
import { IAuditLogRepository } from '../../ports/IAuditLogRepository';
import { GroupErrors } from '../../../domain/errors/GroupErrors';
import { Result } from '../../../shared/Results';

export class RequestJoinGroupUseCase {
 
  constructor(
    private readonly groupRepository:        IGroupRepository,
    private readonly groupRequestRepository: IGroupRequestRepository,
    private readonly auditLogRepository:     IAuditLogRepository,
  ) {}
 
  async execute(groupId: string, requesterEmail: string): Promise<Result<void>> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) return Result.fail(GroupErrors.GROUP_NOT_FOUND);
 
    if (group.isMember(requesterEmail)) return Result.fail(GroupErrors.ALREADY_MEMBER);
 
    const existing = await this.groupRequestRepository.findByGroupAndUser(groupId, requesterEmail);
    if (existing && existing.status === 'pending') return Result.fail(GroupErrors.REQUEST_ALREADY_SENT);
 
    await this.groupRequestRepository.save(groupId, requesterEmail);
 
    await this.auditLogRepository.log({
      action:    'JOIN_REQUESTED',
      userEmail: requesterEmail,
      groupId,
    });
 
    return Result.ok(undefined);
  }
}
 
interface HandleJoinRequestDTO {
  requestId:      string;
  requesterEmail: string;
  action:         'approved' | 'rejected';
  role?:          'admin' | 'member';
}
 
export class HandleJoinRequestUseCase {
 
  constructor(
    private readonly groupRepository:        IGroupRepository,
    private readonly groupRequestRepository: IGroupRequestRepository,
    private readonly auditLogRepository:     IAuditLogRepository,
  ) {}
 
  async execute(dto: HandleJoinRequestDTO): Promise<Result<void>> {
    const request = await this.groupRequestRepository.findById(dto.requestId);
    if (!request) return Result.fail(GroupErrors.REQUEST_NOT_FOUND);
 
    const group = await this.groupRepository.findById(request.groupId);
    if (!group) return Result.fail(GroupErrors.GROUP_NOT_FOUND);
 
    if (!group.isAdmin(dto.requesterEmail)) return Result.fail(GroupErrors.NOT_ADMIN);
 
    await this.groupRequestRepository.updateStatus(dto.requestId, dto.action);
 
    if (dto.action === 'approved') {
      const role = dto.role ?? 'member';
      await this.groupRepository.addMember(request.groupId, request.userId, role);
    }
 
    await this.auditLogRepository.log({
      action:    dto.action === 'approved' ? 'JOIN_APPROVED' : 'JOIN_REJECTED',
      userEmail: dto.requesterEmail,
      groupId:   request.groupId,
      metadata:  { targetUser: request.userId },
    });
 
    return Result.ok(undefined);
  }
}
 