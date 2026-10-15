export type UserRole = 'farmer' | 'officer';

export interface IUser {
  _id: string;
  username: string;
  fullName: string;
  role: UserRole;
  password?: string;
  district?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CaseStatus = 'Submitted' | 'In Review' | 'Resolved';
export type CasePriority = 'Low' | 'Medium' | 'High';

export interface IDiagnosisResult {
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
  analyzedAt: string;
}

export interface IAuditEntry {
  action: string;
  by: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: Date;
  note?: string;
  previousStatus?: CaseStatus;
  newStatus?: CaseStatus;
}
