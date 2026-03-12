import { Schema, model, Document, Types } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { timestamps: true }
);

// índice para busca por email (login)
UserSchema.index({ email: 1 });

export const UserModel = model<IUserDocument>('User', UserSchema);