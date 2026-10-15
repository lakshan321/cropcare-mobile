import { Schema, model, Document, Types } from 'mongoose';

export interface IDiagnosisDocument extends Document {
  userId: Types.ObjectId;
  draftId?: Types.ObjectId;
  imageUrl: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Healthy' | 'Unknown';
  symptoms: string[];
  causes: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  prevention: string[];
  isMock: boolean;
  provider: string;
  status: 'processing' | 'completed' | 'cancelled' | 'failed';
  farmerNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

const diagnosisSchema = new Schema<IDiagnosisDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    draftId: {
      type: Schema.Types.ObjectId,
      ref: 'ImageDraft',
    },
    imageUrl: {
      type: String,
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
      min: 0,
      max: 100,
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Healthy', 'Unknown'],
      default: 'Moderate',
    },
    symptoms: [{ type: String }],
    causes: [{ type: String }],
    organicTreatment: [{ type: String }],
    chemicalTreatment: [{ type: String }],
    prevention: [{ type: String }],
    isMock: {
      type: Boolean,
      default: true,
    },
    provider: {
      type: String,
      default: 'mock',
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'cancelled', 'failed'],
      default: 'completed',
      index: true,
    },
    farmerNotes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

export const Diagnosis = model<IDiagnosisDocument>('Diagnosis', diagnosisSchema);
