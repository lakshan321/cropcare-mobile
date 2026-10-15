import { Router } from 'express';
import {
  getCareTasks,
  createCareTask,
  updateCareTask,
  deleteCareTask,
} from '../controllers/careTasks.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCareTasks);
router.post('/', createCareTask);
router.patch('/:id', updateCareTask);
router.delete('/:id', deleteCareTask);

export default router;
