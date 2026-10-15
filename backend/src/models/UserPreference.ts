import { Schema, model, Document, Types } from 'mongoose';

export interface IUserPreferenceDocument extends Document {
  userId: Types.ObjectId;
  language: 'en' | 'si' | 'ta';
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreferenceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserPreference = model<IUserPreferenceDocument>('UserPreference', userPreferenceSchema);
