import { Router } from 'express';
import {
  saveDiagnosis,
  getSavedDiagnoses,
  getSavedDiagnosisById,
  updateSavedDiagnosis,
  deleteSavedDiagnosis,
} from '../controllers/savedDiagnosis.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', saveDiagnosis);
router.get('/', getSavedDiagnoses);
router.get('/:id', getSavedDiagnosisById);
router.patch('/:id', updateSavedDiagnosis);
router.delete('/:id', deleteSavedDiagnosis);

export default router;
