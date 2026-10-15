import { Router } from 'express';
import {
  createDraft,
  getCurrentDraft,
  getDraftById,
  updateDraft,
  deleteDraft,
} from '../controllers/drafts.controller';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', uploadImage.single('image'), createDraft);
router.get('/current', getCurrentDraft);
router.get('/:id', getDraftById);
router.put('/:id', uploadImage.single('image'), updateDraft);
router.delete('/:id', deleteDraft);

export default router;
