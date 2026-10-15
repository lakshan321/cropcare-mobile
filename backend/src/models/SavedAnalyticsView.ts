import { Schema, model, Document, Types } from 'mongoose';

export interface ISavedAnalyticsViewDocument extends Document {
  officerId: Types.ObjectId;
  name: string;
  filters: {
    district?: string;
    crop?: string;
    status?: string;
    priority?: string;
    dateRange?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const savedAnalyticsViewSchema = new Schema<ISavedAnalyticsViewDocument>(
  {
    officerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    filters: {
      district: { type: String, default: 'All' },
      crop: { type: String, default: 'All' },
      status: { type: String, default: 'All' },
      priority: { type: String, default: 'All' },
      dateRange: { type: String, default: 'All' },
    },
  },
  {
    timestamps: true,
  }
);

export const SavedAnalyticsView = model<ISavedAnalyticsViewDocument>(
  'SavedAnalyticsView',
  savedAnalyticsViewSchema
);
