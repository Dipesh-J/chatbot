import { Router } from 'express';
import { createSession, getSessions, sendMessage, getMessages, deleteSession } from '../controllers/chat.controller.js';
import auth from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/sessions', auth, createSession);
router.get('/sessions', auth, getSessions);
router.post('/sessions/:id/messages', auth, chatLimiter, sendMessage);
router.get('/sessions/:id/messages', auth, getMessages);
router.delete('/sessions/:id', auth, deleteSession);

export default router;
