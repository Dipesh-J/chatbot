import { Router } from 'express';
import { getCharts, shareSlack } from '../controllers/dashboard.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/sessions/:id/charts', auth, getCharts);
router.post('/sessions/:id/share-slack', auth, shareSlack);

export default router;
