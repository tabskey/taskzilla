import { Schema, model, Document } from 'mongoose';

export type AuditAction =
  | 'GROUP_CREATED'
  | 'GROUP_DELETED'
  | 'MEMBER_PROMOTED'
  | 'MEMBER_REMOVED'
  | 'JOIN_REQUESTED'
  | 'JOIN_APPROVED'
  | 'JOIN_REJECTED';

export interface IAuditLogDocument extends Document {
  action:    AuditAction;
  userEmail: string;
  groupId:   string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action:    { type: String, required: true },
    userEmail: { type: String, required: true },
    groupId:   { type: String, required: true },
    metadata:  { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ groupId: 1, createdAt: -1 });
AuditLogSchema.index({ userEmail: 1 });

export const AuditLogModel = model<IAuditLogDocument>('AuditLog', AuditLogSchema);