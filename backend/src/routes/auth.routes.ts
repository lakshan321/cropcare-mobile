import { Router } from 'express';
import { register, login, getMe, registerSchema, loginSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
