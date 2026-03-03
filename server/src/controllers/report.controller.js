import Report from '../models/Report.js';
import User from '../models/User.js';
import axios from 'axios';
import { sendSlackMessage, sendSlackDM, isComposioConfigured } from '../services/composio.service.js';
import { markdownToSlackBlocks } from '../utils/slack-blocks.js';

export async function getReports(req, res, next) {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

export async function getReport(req, res, next) {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ report });
  } catch (error) {
    next(error);
  }
}

export async function shareToSlack(req, res, next) {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) return res.status(404).json({ error: 'Report not found' });

    const user = await User.findById(req.user._id).lean();

    // Build rich Block Kit payload from the markdown content
    const { blocks, text } = markdownToSlackBlocks(report.title, report.content);

    const { channel, userId } = req.body;
    const isDM = !!userId;

    // ── Try Composio first (user's personal OAuth connection) ───────────────
    if (isComposioConfigured()) {
      let composioResult;

      if (isDM) {
        // DMs don't support blocks via the simple send action — send plain mrkdwn
        composioResult = await sendSlackDM({
          entityId: req.user._id.toString(),
          userId,
          text,
        });
      } else {
        composioResult = await sendSlackMessage({
          channel: channel || user?.slackConfig?.channel || '#general',
          text,
          blocks,
          entityId: req.user._id.toString(),
        });
      }

      if (composioResult) {
        report.sharedToSlack = true;
        await report.save();
        return res.json({ message: 'Report shared to Slack via Composio' });
      }
    }

    // ── Fall back to webhook (channel only, not DMs) ─────────────────────────
    if (!isDM) {
      const webhookUrl = user?.slackConfig?.webhookUrl;
      if (!webhookUrl) {
        return res.status(400).json({
          error: 'Slack not connected. Go to Settings → Integrations and click "Connect Slack" to authorize your Slack workspace.',
        });
      }

      await axios.post(webhookUrl, { text, blocks });

      report.sharedToSlack = true;
      await report.save();

      return res.json({ message: 'Report shared to Slack' });
    }

    return res.status(400).json({
      error: 'Failed to share to Slack. Please ensure Slack is connected via Settings.',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReport(req, res, next) {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    next(error);
  }
}
