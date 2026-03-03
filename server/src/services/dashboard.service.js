import ChatSession from '../models/ChatSession.js';
import { emitChartUpdate } from '../socket/index.js';
import { sendSlackMessage, isComposioConfigured } from './composio.service.js';
import env from '../config/env.js';

export async function addChartToSession(sessionId, chart) {
  const session = await ChatSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  if (!session.dashboardState) {
    session.dashboardState = { charts: [] };
  }

  session.dashboardState.charts.push(chart);
  await session.save();

  emitChartUpdate(sessionId, chart);

  return chart;
}

export async function getSessionCharts(sessionId) {
  const session = await ChatSession.findById(sessionId);
  return session?.dashboardState?.charts || [];
}

/**
 * Share a dashboard snapshot to Slack.
 * Priority order:
 *   1. Composio (per-user OAuth connection — preferred)
 *   2. Slack Bot Token with files.uploadV2 (image upload)
 *   3. Slack Incoming Webhook (text-only fallback)
 * 
 * @param {string} sessionId - The session ID
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} channel - Channel ID (for channel sharing)
 * @param {string} entityId - User entity ID for Composio
 */
export async function shareDashboardToSlack(sessionId, imageBase64, channel, entityId) {
  const session = await ChatSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  // Build KPI summary with Slack Blocks
  const kpiCard = session.dashboardState?.charts?.find((c) => c.type === 'kpi');
  
  // Build blocks for rich Slack formatting
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Dashboard Shared',
        emoji: true,
      },
    },
  ];

  if (kpiCard?.config?.kpis) {
    const kpiFields = Object.entries(kpiCard.config.kpis).map(([key, val]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
      return {
        type: 'mrkdwn',
        text: `*${label}:*\n${typeof val === 'number' ? val.toLocaleString() : val}`,
      };
    });

    // Add in pairs for 2-column layout
    for (let i = 0; i < kpiFields.length; i += 2) {
      blocks.push({
        type: 'section',
        fields: [kpiFields[i], kpiFields[i + 1] || { type: 'mrkdwn', text: '' }],
      });
    }
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `📈 ${session.title || 'Financial Report'}`,
      },
    ],
  });

  // Plain text fallback for notifications
  const kpiText = kpiCard?.config?.kpis
    ? Object.entries(kpiCard.config.kpis)
        .map(([key, val]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
          return `*${label}:* ${typeof val === 'number' ? val.toLocaleString() : val}`;
        })
        .join('\n')
    : '';

  const messageText = kpiText
    ? `📊 *Dashboard Shared*\n\n${kpiText}`
    : '📊 *Dashboard Shared*';

  const target = channel || env.SLACK_DEFAULT_CHANNEL || '#general';

  // ── 1. Try Composio (user's personal Slack OAuth connection) ──────────────
  if (isComposioConfigured() && entityId) {
    console.log('shareDashboardToSlack: Sending to channel:', target);
    const composioResult = await sendSlackMessage({
      channel: target,
      text: messageText,
      blocks,
      entityId,
    });
    console.log('shareDashboardToSlack: Channel message result:', composioResult);

    if (composioResult) {
      // After sending message via Composio, also try to upload image via Bot Token
      if (imageBase64 && env.SLACK_BOT_TOKEN) {
        try {
          const { WebClient } = await import('@slack/web-api');
          const client = new WebClient(env.SLACK_BOT_TOKEN);

          console.log('shareDashboardToSlack: Attempting image upload with Bot Token');
          console.log('shareDashboardToSlack: Channel value:', channel);

          // Get channel ID from name (filesUploadV2 requires channel ID, not name)
          let targetChannelId = channel;
          if (channel && !channel.startsWith('C')) {
            console.log('shareDashboardToSlack: Looking up channel ID for:', channel);
            const channelList = await client.conversations.list({ types: 'public_channel,private_channel' });
            console.log('shareDashboardToSlack: Available channels:', channelList.channels?.map(c => c.name));
            const found = channelList.channels?.find(c => c.name === channel.replace(/^#/, ''));
            if (found) {
              targetChannelId = found.id;
              console.log('shareDashboardToSlack: Found channel ID:', targetChannelId);
            } else {
              console.error('shareDashboardToSlack: Channel not found:', channel);
            }
          } else {
            console.log('shareDashboardToSlack: Using channel ID directly:', targetChannelId);
          }

          if (targetChannelId) {
            // Try to join the channel if not already a member
            try {
              await client.conversations.join({ channel: targetChannelId });
              console.log('shareDashboardToSlack: Joined channel successfully');
            } catch (joinError) {
              if (joinError.data?.error !== 'already_in_channel') {
                console.error('shareDashboardToSlack: Failed to join channel:', joinError.message);
              }
            }

            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            console.log('shareDashboardToSlack: Uploading image, buffer size:', buffer.length);

            await client.filesUploadV2({
              channel_id: targetChannelId,
              file: buffer,
              filename: 'dashboard.png',
              title: `BizCopilot Dashboard — ${session.title || 'Report'}`,
              initial_comment: messageText,
            });
            console.log('shareDashboardToSlack: Image uploaded successfully');
          } else {
            console.error('shareDashboardToSlack: No target channel ID, skipping image upload');
          }
        } catch (imgError) {
          console.error('shareDashboardToSlack: Failed to upload image via Bot token:', imgError.message);
          console.error('shareDashboardToSlack: Error details:', imgError.stack);
        }
      }
      return { success: true, method: 'composio' };
    }
    console.log('shareDashboardToSlack: Composio returned null, trying fallback...');
  }

  // ── 2. Try Slack Bot Token (image upload) ────────────────────────────────
  if (env.SLACK_BOT_TOKEN) {
    const { WebClient } = await import('@slack/web-api');
    const client = new WebClient(env.SLACK_BOT_TOKEN);
    
    const channelName = channel || env.SLACK_DEFAULT_CHANNEL || 'general';
    
    // Get channel ID from name (filesUploadV2 requires channel ID)
    let targetChannelId = channelName;
    if (!channelName.startsWith('C')) {
      const channelList = await client.conversations.list({ types: 'public_channel,private_channel' });
      const found = channelList.channels?.find(c => c.name === channelName.replace(/^#/, ''));
      if (found) {
        targetChannelId = found.id;
      } else {
        console.error('shareDashboardToSlack: Channel not found:', channelName);
      }
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Try to join the channel if not already a member
    try {
      await client.conversations.join({ channel: targetChannelId });
    } catch (joinError) {
      if (joinError.data?.error !== 'already_in_channel') {
        console.error('shareDashboardToSlack: Failed to join channel:', joinError.message);
      }
    }

    await client.filesUploadV2({
      channel_id: targetChannelId,
      file: buffer,
      filename: 'dashboard.png',
      title: `BizCopilot Dashboard — ${session.title || 'Report'}`,
      initial_comment: messageText,
    });

    return { success: true, method: 'slack-bot' };
  }

  // ── 3. Try Slack Incoming Webhook (text-only) ───────────────────────────
  if (env.SLACK_WEBHOOK_URL) {
    const { default: axios } = await import('axios');
    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `📊 BizCopilot Dashboard — ${session.title || 'Report'}` },
      },
    ];

    if (kpiText) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: kpiText } });
    }

    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '_Connect Slack via Settings → Integrations for image sharing._' }],
    });

    await axios.post(env.SLACK_WEBHOOK_URL, { blocks });
    return { success: true, method: 'webhook-fallback' };
  }

  // ── Nothing configured ───────────────────────────────────────────────────
  throw new Error(
    'Slack not connected. Go to Settings → Integrations and click "Connect Slack" to authorize your Slack workspace.'
  );
}
