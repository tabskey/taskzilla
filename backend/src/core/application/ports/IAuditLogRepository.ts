import { AuditAction } from '../../../infra/mongoose/models/AuditlogModel';

export interface CreateAuditLogDTO {
  action:    AuditAction;
  userEmail: string;
  groupId:   string;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogRepository {
  log(dto: CreateAuditLogDTO): Promise<void>;
}