import { Schema, model, Document, Types } from 'mongoose';
import { CaseStatus, CasePriority, IAuditEntry } from '../types';

export interface IPrivateDraft {
  confirmedDisease?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  treatment?: string;
  instructions?: string;
  followUpDate?: Date;
  updatedAt?: Date;
  officerId?: Types.ObjectId;
}

export interface IPublishedResponse {
  confirmedDisease: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  treatment: string;
  instructions: string;
  followUpDate?: Date;
  officerId: Types.ObjectId;
  officerName: string;
  publishedAt: Date;
  updatedAt?: Date;
  isWithdrawn?: boolean;
  withdrawnAt?: Date;
}

export interface IConsultationDocument extends Document {
  farmerId: Types.ObjectId;
  farmerName: string;
  farmerPhone?: string;
  diagnosisId: Types.ObjectId;
  imageUrl: string;
  crop: string;
  aiSuggestedDisease: string;
  aiConfidence: number;
  farmerNotes: string;
  location: string;
  district: string;
  office: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedOfficerId?: Types.ObjectId;
  assignedOfficerName?: string;
  privateDraft?: IPrivateDraft;
  publishedResponse?: IPublishedResponse;
  auditTrail: IAuditEntry[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<IAuditEntry>(
  {
    action: { type: String, required: true },
    by: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    previousStatus: { type: String },
    newStatus: { type: String },
  },
  { _id: false }
);

const privateDraftSchema = new Schema<IPrivateDraft>(
  {
    confirmedDisease: { type: String },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    treatment: { type: String },
    instructions: { type: String },
    followUpDate: { type: Date },
    updatedAt: { type: Date, default: Date.now },
    officerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const publishedResponseSchema = new Schema<IPublishedResponse>(
  {
    confirmedDisease: { type: String, required: true },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
    treatment: { type: String, required: true },
    instructions: { type: String, required: true },
    followUpDate: { type: Date },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    officerName: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    isWithdrawn: { type: Boolean, default: false },
    withdrawnAt: { type: Date },
  },
  { _id: false }
);

const consultationSchema = new Schema<IConsultationDocument>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmerName: {
      type: String,
      required: true,
      trim: true,
    },
    farmerPhone: {
      type: String,
      default: '',
    },
    diagnosisId: {
      type: Schema.Types.ObjectId,
      ref: 'Diagnosis',
      required: true,
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
    aiSuggestedDisease: {
      type: String,
      required: true,
    },
    aiConfidence: {
      type: Number,
      required: true,
    },
    farmerNotes: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    office: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Submitted', 'In Review', 'Resolved'],
      default: 'Submitted',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true,
    },
    assignedOfficerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedOfficerName: {
      type: String,
      default: '',
    },
    privateDraft: {
      type: privateDraftSchema,
      default: undefined,
    },
    publishedResponse: {
      type: publishedResponseSchema,
      default: undefined,
    },
    auditTrail: [auditEntrySchema],
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for officer search and filtering
consultationSchema.index({ status: 1, priority: 1, createdAt: -1 });
consultationSchema.index({ district: 1, crop: 1, status: 1 });

export const Consultation = model<IConsultationDocument>('Consultation', consultationSchema);
