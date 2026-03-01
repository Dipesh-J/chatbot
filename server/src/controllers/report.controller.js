import Report from '../models/Report.js';
import User from '../models/User.js';
import axios from 'axios';
import { sendSlackMessage, isComposioConfigured } from '../services/composio.service.js';

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
    const text = `*BizCopilot: ${report.title}*\n\n${report.content.slice(0, 2500)}`;

    // Try Composio first
    if (isComposioConfigured()) {
      const composioResult = await sendSlackMessage({
        channel: user?.slackConfig?.channel || '#general',
        text,
        entityId: req.user._id.toString(),
      });

      if (composioResult) {
        report.sharedToSlack = true;
        await report.save();
        return res.json({ message: 'Report shared to Slack via Composio' });
      }
    }

    // Fall back to webhook
    const webhookUrl = user?.slackConfig?.webhookUrl;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Slack not connected. Configure a webhook or connect via Composio in settings.' });
    }

    await axios.post(webhookUrl, {
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `BizCopilot: ${report.title}` } },
        { type: 'section', text: { type: 'mrkdwn', text: report.content.slice(0, 2500) } },
      ],
    });

    report.sharedToSlack = true;
    await report.save();

    res.json({ message: 'Report shared to Slack' });
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
