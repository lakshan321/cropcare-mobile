import { IDiagnosisProvider } from './diagnosisProvider.interface';
import { MockDiagnosisProvider } from './mockDiagnosisProvider';
import { RealDiagnosisProvider } from './realDiagnosisProvider';
import { env } from '../config/env';

let providerInstance: IDiagnosisProvider | null = null;

export const getDiagnosisProvider = (): IDiagnosisProvider => {
  if (providerInstance) {
    return providerInstance;
  }

  const providerType = (env.DIAGNOSIS_PROVIDER || 'mock').toLowerCase().trim();

  if (providerType === 'real') {
    console.log('[DiagnosisProvider] Initializing Real AI Diagnosis Provider');
    providerInstance = new RealDiagnosisProvider();
  } else {
    console.log('[DiagnosisProvider] Initializing Mock Diagnosis Provider');
    providerInstance = new MockDiagnosisProvider();
  }

  return providerInstance;
};
