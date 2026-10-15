import { Schema, model, Document, Types } from 'mongoose';

export interface ISavedDiagnosisDocument extends Document {
  userId: Types.ObjectId;
  diagnosisId: Types.ObjectId;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  imageUrl: string;
  personalObservations: string;
  savedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedDiagnosisSchema = new Schema<ISavedDiagnosisDocument>(
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
      required: true,
    },
    crop: {
      type: String,
      required: true,
      index: true,
    },
    disease: {
      type: String,
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    severity: {
      type: String,
      default: 'Moderate',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    personalObservations: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    savedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user search
savedDiagnosisSchema.index({ userId: 1, crop: 1, disease: 1 });

export const SavedDiagnosis = model<ISavedDiagnosisDocument>('SavedDiagnosis', savedDiagnosisSchema);
