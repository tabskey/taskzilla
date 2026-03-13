import { Schema, model, Document, Types } from 'mongoose';

export type GroupRole = 'owner' | 'admin' | 'member';

export interface IGroupMember {
  user:     Types.ObjectId;   // ref → User
  role:     GroupRole;
  joinedAt: Date;
}

export interface IGroupDocument extends Document {
  name:        string;
  description: string;

  members:     IGroupMember[];  
  createdBy:   Types.ObjectId;  
  createdAt:   Date;
  updatedAt:   Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:     { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroupDocument>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    members:     { type: [GroupMemberSchema], default: [] },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

GroupSchema.index({ 'members.user': 1 });

export const Group = model<IGroupDocument>('Group', GroupSchema);