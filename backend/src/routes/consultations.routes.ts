import { Router } from 'express';
import {
  createConsultation,
  getMyConsultations,
  getConsultationById,
  updateConsultationNotes,
  cancelConsultation,
} from '../controllers/consultations.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createConsultation);
router.get('/my', getMyConsultations);
router.get('/:id', getConsultationById);
router.patch('/:id', updateConsultationNotes);
router.delete('/:id', cancelConsultation);

export default router;
