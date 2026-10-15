import { Router } from 'express';
import { getPreferences, updatePreferences } from '../controllers/preferences.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getPreferences);
router.put('/', updatePreferences);

export default router;
