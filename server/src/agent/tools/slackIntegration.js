import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import Report from '../../models/Report.js';
import User from '../../models/User.js';
import { sendSlackMessage, isComposioConfigured } from '../../services/composio.service.js';

const shareToSlack = tool(
  async ({ reportId, message, channel }, config) => {
    const userId = config.configurable?.userId;
    if (!userId) return 'Error: No user context available.';

    const user = await User.findById(userId).lean();

    let text = message || '';

    if (reportId) {
      const report = await Report.findOne({ _id: reportId, userId }).lean();
      if (!report) return 'Report not found.';

      text = `*${report.title}*\n\n${report.content.slice(0, 2500)}`;
      await Report.findByIdAndUpdate(reportId, { sharedToSlack: true });
    }

    if (!text) return 'No content to share. Provide a reportId or message.';

    // Strategy 1: Try Composio managed Slack connection first
    if (isComposioConfigured()) {
      const composioResult = await sendSlackMessage({
        channel: channel || user?.slackConfig?.channel || '#general',
        text,
        entityId: userId,
      });

      if (composioResult) {
        return JSON.stringify({
          success: true,
          via: 'composio',
          message: 'Report shared to Slack via Composio successfully!',
        });
      }
    }

    // Strategy 2: Fall back to raw webhook
    const webhookUrl = user?.slackConfig?.webhookUrl;
    if (!webhookUrl) {
      return 'Slack not connected. Either configure a webhook URL in settings or connect Slack via Composio.';
    }

    try {
      await axios.post(webhookUrl, {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: 'BizCopilot Report' },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text },
          },
        ],
      });

      return JSON.stringify({
        success: true,
        via: 'webhook',
        message: 'Report shared to Slack via webhook successfully!',
      });
    } catch (error) {
      return `Failed to share to Slack: ${error.message}`;
    }
  },
  {
    name: 'share_to_slack',
    description:
      'Share a report or message to the user\'s Slack channel. Uses Composio managed connection if available, otherwise falls back to webhook. Use when the user asks to "share to Slack", "send to Slack", or "post to Slack".',
    schema: z.object({
      reportId: z.string().optional().describe('ID of a saved report to share'),
      message: z.string().optional().describe('Custom message to share if no reportId'),
      channel: z.string().optional().describe('Slack channel to post to (e.g. #general)'),
    }),
  }
);

export default shareToSlack;
