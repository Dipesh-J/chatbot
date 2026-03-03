import { Router } from 'express';
import {
  createTool,
  listTools,
  suggestTools,
  testTool,
  updateTool,
  toggleTool,
  deleteTool,
} from '../controllers/mcpTool.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/', auth, createTool);
router.get('/', auth, listTools);
router.get('/suggest/:connectorId', auth, suggestTools);
router.post('/:id/test', auth, testTool);
router.put('/:id', auth, updateTool);
router.patch('/:id/toggle', auth, toggleTool);
router.delete('/:id', auth, deleteTool);

export default router;
