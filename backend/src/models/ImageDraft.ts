import { Schema, model, Document, Types } from 'mongoose';

export interface IImageDraftDocument extends Document {
  userId: Types.ObjectId;
  imageUrl: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  cropNote?: string;
  status: 'draft' | 'analyzed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const imageDraftSchema = new Schema<IImageDraftDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    cropNote: {
      type: String,
      maxlength: 300,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'analyzed', 'cancelled'],
      default: 'draft',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ImageDraft = model<IImageDraftDocument>('ImageDraft', imageDraftSchema);
