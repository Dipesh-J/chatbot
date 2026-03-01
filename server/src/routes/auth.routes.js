import { Router } from 'express';
import { signup, login, googleAuth, googleCallback, getMe, updateProfile } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/me', auth, getMe);
router.patch('/me', auth, updateProfile);

export default router;
