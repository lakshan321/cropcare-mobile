export type UserRole = 'farmer' | 'officer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  district?: string;
  phone?: string;
}

export type CaseStatus = 'Submitted' | 'In Review' | 'Resolved';
export type CasePriority = 'Low' | 'Medium' | 'High';

export interface DiagnosisResult {
  _id: string;
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
  imageUrl: string;
  farmerNotes?: string;
  createdAt: string;
}

export interface SavedDiagnosis {
  _id: string;
  diagnosisId: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  imageUrl: string;
  personalObservations: string;
  savedDate: string;
}

export interface CareTask {
  _id: string;
  task: string;
  category: 'immediate' | 'organic' | 'chemical' | 'prevention' | 'custom';
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface PublishedResponse {
  confirmedDisease: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  treatment: string;
  instructions: string;
  followUpDate?: string;
  officerId: string;
  officerName: string;
  publishedAt: string;
  isWithdrawn?: boolean;
}

export interface PrivateDraft {
  confirmedDisease?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  treatment?: string;
  instructions?: string;
  followUpDate?: string;
}

export interface ConsultationCase {
  _id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  diagnosisId: string;
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
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  publishedResponse?: PublishedResponse;
  privateDraft?: PrivateDraft;
  auditTrail?: Array<{
    action: string;
    by: { id: string; name: string; role: string };
    timestamp: string;
    note?: string;
  }>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedAnalyticsView {
  _id: string;
  name: string;
  filters: {
    district?: string;
    crop?: string;
    status?: string;
    priority?: string;
    dateRange?: string;
  };
  createdAt: string;
}
