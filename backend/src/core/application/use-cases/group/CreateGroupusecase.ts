import { IGroupRepository } from '../../ports/IGroupRepository';
import { IAuditLogRepository } from '../../ports/IAuditLogRepository';
import { Group } from '../../../domain/entities/Group';
import { Result } from '../../../shared/Results';

interface CreateGroupDTO {
  name:         string;
  description?: string;
  isPublic:     boolean;
  ownerEmail:   string;
}
 
interface CreateGroupResponse {
  id:          string;
  name:        string;
  description: string;
  isPublic:    boolean;
}
 
export class CreateGroupUseCase {
 
  constructor(
    private readonly groupRepository:    IGroupRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}
 
  async execute(dto: CreateGroupDTO): Promise<Result<CreateGroupResponse>> {
    const groupResult = Group.create({
      name:        dto.name,
      description: dto.description,
      isPublic:    dto.isPublic,
      members:     [{ userId: dto.ownerEmail, role: 'owner', joinedAt: new Date() }],
    });
 
    if (groupResult.isFailure) return Result.fail(groupResult.error!);
 
    const group = groupResult.getValue();
    const id    = await this.groupRepository.save(group);
 
    await this.auditLogRepository.log({
      action:    'GROUP_CREATED',
      userEmail: dto.ownerEmail,
      groupId:   id,
      metadata:  { name: dto.name, isPublic: dto.isPublic },
    });
 
    return Result.ok({ id, name: group.name, description: group.description, isPublic: group.isPublic });
  }
}