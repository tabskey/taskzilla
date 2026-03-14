import { Schema, model, Document, Types } from 'mongoose';

export interface IGroupMember {
  user:     Types.ObjectId;
  role:     'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface IGroupDocument extends Document {
  name:        string;
  description: string;
  isPublic:    boolean;
  members:     IGroupMember[];
  createdAt:   Date;
  updatedAt:   Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:     { type: String, enum: ['owner', 'admin', 'member'], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroupDocument>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    isPublic:    { type: Boolean, default: true },
    members:     [GroupMemberSchema],
  },
  { timestamps: true }
);

// índices para performance
GroupSchema.index({ 'members.user': 1 });
GroupSchema.index({ isPublic: 1 });

export const GroupModel = model<IGroupDocument>('Group', GroupSchema);