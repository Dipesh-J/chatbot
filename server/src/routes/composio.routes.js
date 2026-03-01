import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getSlackAuthUrl,
  hasSlackConnection,
  isComposioConfigured,
} from '../services/composio.service.js';

const router = Router();

// Check Composio integration status
router.get('/status', auth, async (req, res) => {
  const configured = isComposioConfigured();
  let slackConnected = false;

  if (configured) {
    slackConnected = await hasSlackConnection(req.user._id.toString());
  }

  res.json({ composioConfigured: configured, slackConnected });
});

// Initiate Composio Slack OAuth connection
router.post('/connect/slack', auth, async (req, res) => {
  if (!isComposioConfigured()) {
    return res.status(400).json({ error: 'Composio not configured' });
  }

  const authUrl = await getSlackAuthUrl(req.user._id.toString());
  if (!authUrl) {
    return res.status(500).json({ error: 'Failed to create Slack connection URL' });
  }

  res.json({ authUrl });
});

export default router;
