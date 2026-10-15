import { Router } from 'express';
import {
  getAnalyticsSummary,
  exportAnalyticsCSV,
  getSavedViews,
  createSavedView,
  updateSavedView,
  deleteSavedView,
} from '../controllers/analytics.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('officer'));

router.get('/summary', getAnalyticsSummary);
router.get('/export.csv', exportAnalyticsCSV);
router.get('/views', getSavedViews);
router.post('/views', createSavedView);
router.put('/views/:id', updateSavedView);
router.delete('/views/:id', deleteSavedView);

export default router;
