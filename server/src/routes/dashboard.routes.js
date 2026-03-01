import { Router } from 'express';
import { getCharts } from '../controllers/dashboard.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/sessions/:id/charts', auth, getCharts);

export default router;
