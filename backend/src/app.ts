import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import draftsRoutes from './routes/drafts.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import savedDiagnosisRoutes from './routes/savedDiagnosis.routes';
import careTasksRoutes from './routes/careTasks.routes';
import preferencesRoutes from './routes/preferences.routes';
import consultationsRoutes from './routes/consultations.routes';
import officerRoutes from './routes/officer.routes';
import analyticsRoutes from './routes/analytics.routes';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded plant photos statically
const uploadDir = path.resolve(__dirname, '../', env.UPLOAD_DIR);
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    project: 'CropCare Mobile App API (IT3060 Group WE_178)',
    diagnosisProvider: env.DIAGNOSIS_PROVIDER,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/saved-diagnoses', savedDiagnosisRoutes);
app.use('/api/care-tasks', careTasksRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Centralized error handler
app.use(errorHandler);
