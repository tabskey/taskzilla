import { Schema, model, Document, Types } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?:    string;
  authProvider: 'local' | 'google' | 'both';
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String, required: false },
    googleId:     { type: String, required: false },
    authProvider: { type: String, enum: ['local', 'google', 'both'], default: 'local' },  
    role:          { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { timestamps: true }
);

export const UserModel = model<IUserDocument>('User', UserSchema);