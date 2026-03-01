import { Router } from 'express';
import { getReports, getReport, shareToSlack, deleteReport } from '../controllers/report.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getReports);
router.get('/:id', auth, getReport);
router.post('/:id/share-slack', auth, shareToSlack);
router.delete('/:id', auth, deleteReport);

export default router;
