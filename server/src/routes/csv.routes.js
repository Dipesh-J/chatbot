import { Router } from 'express';
import { uploadCSV, getDatasets, getDataset, deleteDataset } from '../controllers/csv.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/upload', auth, upload.single('file'), uploadCSV);
router.get('/datasets', auth, getDatasets);
router.get('/datasets/:id', auth, getDataset);
router.delete('/datasets/:id', auth, deleteDataset);

export default router;
