import { Schema, model, Document, Types } from 'mongoose';

export interface IGroupRequestDocument extends Document {
  group:     Types.ObjectId;
  user:      Types.ObjectId;
  status:    'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const GroupRequestSchema = new Schema<IGroupRequestDocument>(
  {
    group:  { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    user:   { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

GroupRequestSchema.index({ group: 1, user: 1 }, { unique: true });
GroupRequestSchema.index({ group: 1, status: 1 });

export const GroupRequestModel = model<IGroupRequestDocument>('GroupRequest', GroupRequestSchema);