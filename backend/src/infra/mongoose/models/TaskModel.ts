import { Schema, model, Document, Types } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskColumn   = 'backlog' | 'todo' | 'progress' | 'review' | 'done';

// item de checklist embutido na task
export interface IChecklistItem {
  _id:   Types.ObjectId;
  text:  string;
  done:  boolean;
}

// comentário embutido na task
export interface IComment {
  _id:       Types.ObjectId;
  author:    Types.ObjectId;  // ref → User
  text:      string;
  createdAt: Date;
}

export interface ITaskDocument extends Document {
  title:      string;
  description:string;
  column:     TaskColumn;
  priority:   TaskPriority;
  project:    Types.ObjectId;  // ref → Project
  assignee?:  Types.ObjectId;  // ref → User
  dueDate?:   Date;
  tags:       string[];
  checklist:  IChecklistItem[];
  comments:   IComment[];
  order:      number;           // posição dentro da coluna (drag & drop)
  createdBy:  Types.ObjectId;  // ref → User
  createdAt:  Date;
  updatedAt:  Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  }
);

const CommentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text:   { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const TaskSchema = new Schema<ITaskDocument>(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    column:      {
      type:    String,
      enum:    ['backlog', 'todo', 'progress', 'review', 'done'],
      default: 'backlog',
    },
    priority:    {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'medium',
    },
    project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee:   { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate:    { type: Date },
    tags:       { type: [String], default: [] },
    checklist:  { type: [ChecklistItemSchema], default: [] },
    comments:   { type: [CommentSchema],       default: [] },
    order:      { type: Number, default: 0 },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// índices para as queries do kanban
TaskSchema.index({ project: 1, column: 1, order: 1 }); // carregar board
TaskSchema.index({ assignee: 1 });                      // "minhas tarefas"
TaskSchema.index({ project: 1, dueDate: 1 });           // tarefas próximas do vencimento

export const Task = model<ITaskDocument>('Task', TaskSchema);