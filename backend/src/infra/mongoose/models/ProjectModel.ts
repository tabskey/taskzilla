import { Schema, model, Document, Types } from 'mongoose';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export interface IProjectDocument extends Document {
  name:        string;
  description: string;
  status:      ProjectStatus;
  group:       Types.ObjectId;  // ref → Group  (projeto pertence a um grupo)
  createdBy:   Types.ObjectId;  // ref → User
  dueDate?:    Date;
  progress:    number;          // 0–100, calculado via virtual ou atualizado na task
  tags:        string[];
  createdAt:   Date;
  updatedAt:   Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status:      {
      type:    String,
      enum:    ['planning', 'active', 'on_hold', 'completed'],
      default: 'active',
    },
    group:       { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    dueDate:     { type: Date },
    progress:    { type: Number, default: 0, min: 0, max: 100 },
    tags:        { type: [String], default: [] },
  },
  { timestamps: true }
);

// índices para as queries mais comuns
ProjectSchema.index({ group: 1 });           // buscar projetos de um grupo
ProjectSchema.index({ group: 1, status: 1 }); // filtrar por status dentro do grupo

export const Project = model<IProjectDocument>('Project', ProjectSchema);