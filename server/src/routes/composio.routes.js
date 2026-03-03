import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getSlackAuthUrl,
  hasSlackConnection,
  isComposioConfigured,
  disconnectSlack,
  getSlackChannels,
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

// Get available Slack channels
router.get('/slack/channels', auth, async (req, res) => {
  if (!isComposioConfigured()) {
    return res.status(400).json({ error: 'Composio not configured' });
  }

  try {
    const channels = await getSlackChannels(req.user._id.toString());
    res.json({ channels });
  } catch (error) {
    console.error('Slack channels route error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Slack channels' });
  }
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

// Disconnect Slack integration
router.delete('/slack', auth, async (req, res) => {
  if (!isComposioConfigured()) {
    return res.status(400).json({ error: 'Composio not configured' });
  }

  try {
    await disconnectSlack(req.user._id.toString());
    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect Slack route error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to disconnect Slack. Please try again.',
    });
  }
});

export default router;
