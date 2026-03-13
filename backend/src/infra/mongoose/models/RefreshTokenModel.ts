import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  token:     string;
  user:      Types.ObjectId;
  expiresAt: Date;
  revoked:   boolean;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    token:     { type: String, required: true, unique: true },
    user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    revoked:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// índice para limpeza automática — o MongoDB remove documentos expirados
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);