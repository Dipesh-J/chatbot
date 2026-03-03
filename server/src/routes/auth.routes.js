import { Router } from 'express';
import { signup, login, googleAuth, googleCallback, getMe, updateProfile } from '../controllers/auth.controller.js';
import { googleSheetsAuthCallback } from '../controllers/connector.controller.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/google', googleAuth);
// Sheets OAuth reuses the same redirect URI — intercept before passport
router.get('/google/callback', (req, res, next) => {
  if (req.query.state) {
    try {
      const decoded = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
      if (decoded.type === 'sheets') {
        return googleSheetsAuthCallback(req, res);
      }
    } catch {
      // Not a sheets callback, fall through to passport
    }
  }
  googleCallback(req, res, next);
});
router.get('/me', auth, getMe);
router.patch('/me', auth, updateProfile);

export default router;
