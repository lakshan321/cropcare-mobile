import fs from 'fs';
import { IDiagnosisProvider } from './diagnosisProvider.interface';
import { IDiagnosisResult } from '../types';
import { env } from '../config/env';

export class RealDiagnosisProvider implements IDiagnosisProvider {
  name = 'Real AI Inference Service (FastAPI / PyTorch)';
  isMock = false;

  async analyzeImage(imagePath: string, cropHint?: string): Promise<IDiagnosisResult> {
    if (!env.REAL_PREDICTION_API_URL) {
      throw new Error(
        'Real AI Prediction Provider is enabled, but REAL_PREDICTION_API_URL is not configured in the server environment. ' +
        'Please supply a valid endpoint URL (e.g., http://localhost:8000/predict) and API key in backend/.env.'
      );
    }

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at path: ${imagePath}`);
    }

    // Prepare multipart form upload to the prediction microservice
    const fileBuffer = fs.readFileSync(imagePath);
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, 'leaf.jpg');
    if (cropHint) {
      formData.append('crop_hint', cropHint);
    }

    const headers: Record<string, string> = {};
    if (env.REAL_PREDICTION_API_KEY) {
      headers['Authorization'] = `Bearer ${env.REAL_PREDICTION_API_KEY}`;
    }

    const response = await fetch(env.REAL_PREDICTION_API_URL, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Prediction service returned status ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as any;

    return {
      crop: data.crop || 'Plant / Crop',
      disease: data.disease || 'Undetermined Disease',
      confidence: Math.round(Number(data.confidence) || 0),
      severity: data.severity || 'Moderate',
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
      causes: Array.isArray(data.causes) ? data.causes : [],
      organicTreatment: Array.isArray(data.organicTreatment) ? data.organicTreatment : [],
      chemicalTreatment: Array.isArray(data.chemicalTreatment) ? data.chemicalTreatment : [],
      prevention: Array.isArray(data.prevention) ? data.prevention : [],
      isMock: false,
      provider: `${this.name} (${env.REAL_PREDICTION_API_URL})`,
      analyzedAt: new Date().toISOString(),
    };
  }
}
