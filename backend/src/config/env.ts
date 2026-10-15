import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'cropcare_default_dev_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DIAGNOSIS_PROVIDER: process.env.DIAGNOSIS_PROVIDER || 'mock',
  REAL_PREDICTION_API_URL: process.env.REAL_PREDICTION_API_URL || '',
  REAL_PREDICTION_API_KEY: process.env.REAL_PREDICTION_API_KEY || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};
