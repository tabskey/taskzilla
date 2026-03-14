import { IGroupRepository } from '../../ports/IGroupRepository';
import { Group } from '../../../domain/entities/Group';
import { IAuditLogRepository } from '../../ports/IAuditLogRepository';
import { GroupErrors } from '../../../domain/errors/GroupErrors';
import { Result } from '../../../shared/Results';

interface UpdateGroupDTO {
  groupId:        string;
  requesterEmail: string;
  name?:          string;
  description?:   string;
  isPublic?:      boolean;
}
 
export class UpdateGroupUseCase {
 
  constructor(
    private readonly groupRepository:    IGroupRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}
 
  async execute(dto: UpdateGroupDTO): Promise<Result<void>> {
    const group = await this.groupRepository.findById(dto.groupId);
    if (!group) return Result.fail(GroupErrors.GROUP_NOT_FOUND);
 
    if (!group.isAdmin(dto.requesterEmail)) return Result.fail(GroupErrors.NOT_ADMIN);
 
    const updated = Group.reconstitute({
      id:          group.id,
      name:        dto.name        ?? group.name,
      description: dto.description ?? group.description,
      isPublic:    dto.isPublic    ?? group.isPublic,
      members:     group.members,
    });
 
    await this.groupRepository.update(updated);
    return Result.ok(undefined);
  }
}
 
export class DeleteGroupUseCase {
 
  constructor(
    private readonly groupRepository:    IGroupRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}
 
  async execute(groupId: string, requesterEmail: string): Promise<Result<void>> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) return Result.fail(GroupErrors.GROUP_NOT_FOUND);
 
    if (!group.isOwner(requesterEmail)) return Result.fail(GroupErrors.NOT_OWNER);
 
    await this.groupRepository.delete(groupId);
 
    await this.auditLogRepository.log({
      action:    'GROUP_DELETED',
      userEmail: requesterEmail,
      groupId,
    });
 
    return Result.ok(undefined);
  }
}