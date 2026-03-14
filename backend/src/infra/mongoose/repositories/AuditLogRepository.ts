import { IAuditLogRepository, CreateAuditLogDTO } from '../../../core/application/ports/IAuditLogRepository';
import { AuditLogModel } from '../models/AuditlogModel';

export class AuditLogRepository implements IAuditLogRepository {
  async log(dto: CreateAuditLogDTO): Promise<void> {
    await AuditLogModel.create({
      action:    dto.action,
      userEmail: dto.userEmail,
      groupId:   dto.groupId,
      metadata:  dto.metadata ?? {},
    });
  }
}