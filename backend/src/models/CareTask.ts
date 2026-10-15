import { Schema, model, Document, Types } from 'mongoose';

export interface ICareTaskDocument extends Document {
  userId: Types.ObjectId;
  diagnosisId?: Types.ObjectId;
  task: string;
  category: 'immediate' | 'organic' | 'chemical' | 'prevention' | 'custom';
  isCompleted: boolean;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const careTaskSchema = new Schema<ICareTaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    diagnosisId: {
      type: Schema.Types.ObjectId,
      ref: 'Diagnosis',
    },
    task: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    category: {
      type: String,
      enum: ['immediate', 'organic', 'chemical', 'prevention', 'custom'],
      default: 'custom',
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const CareTask = model<ICareTaskDocument>('CareTask', careTaskSchema);
