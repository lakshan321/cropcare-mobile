import { Router } from 'express';
import {
  getOfficerCases,
  getOfficerCaseById,
  updateCaseAssignmentAndPriority,
  savePrivateDraft,
  getPrivateDraft,
  deletePrivateDraft,
  publishResponse,
  editPublishedResponse,
  withdrawResponse,
} from '../controllers/officer.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Protect ALL officer routes with authentication and role check
router.use(authenticate);
router.use(requireRole('officer'));

router.get('/cases', getOfficerCases);
router.get('/cases/:id', getOfficerCaseById);
router.patch('/cases/:id/status', updateCaseAssignmentAndPriority);
router.put('/cases/:id/draft', savePrivateDraft);
router.get('/cases/:id/draft', getPrivateDraft);
router.delete('/cases/:id/draft', deletePrivateDraft);
router.post('/cases/:id/publish', publishResponse);
router.put('/cases/:id/published', editPublishedResponse);
router.post('/cases/:id/withdraw', withdrawResponse);

export default router;
