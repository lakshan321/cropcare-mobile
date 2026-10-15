import { Router } from 'express';
import {
  analyzePlant,
  getAnalysisJobStatus,
  cancelAnalysisJob,
  getDiagnosisById,
  updateFarmerNotes,
} from '../controllers/diagnosis.controller';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/analyze', uploadImage.single('image'), analyzePlant);
router.get('/jobs/:id', getAnalysisJobStatus);
router.delete('/jobs/:id', cancelAnalysisJob);
router.get('/:id', getDiagnosisById);
router.patch('/:id/notes', updateFarmerNotes);

export default router;
