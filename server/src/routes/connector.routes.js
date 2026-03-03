import { Router } from 'express';
import {
  createConnector,
  listConnectors,
  testBeforeSave,
  testConnector,
  introspectConnector,
  runQuery,
  updateConnector,
  deleteConnector,
  googleSheetsAuthStart,
} from '../controllers/connector.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/google/auth', auth, googleSheetsAuthStart);
router.post('/', auth, createConnector);
router.get('/', auth, listConnectors);
router.post('/test', auth, testBeforeSave);
router.post('/:id/test', auth, testConnector);
router.post('/:id/introspect', auth, introspectConnector);
router.post('/:id/run-query', auth, runQuery);
router.put('/:id', auth, updateConnector);
router.delete('/:id', auth, deleteConnector);

export default router;
