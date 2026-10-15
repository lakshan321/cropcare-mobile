import { IDiagnosisResult } from '../types';

export interface IDiagnosisProvider {
  name: string;
  isMock: boolean;
  analyzeImage(imagePath: string, cropHint?: string): Promise<IDiagnosisResult>;
}
