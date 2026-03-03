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
 */
export async function shareDashboardToSlack(sessionId, imageBase64, channel, entityId) {
  const session = await ChatSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  // Build KPI summary text
  const kpiCard = session.dashboardState?.charts?.find((c) => c.type === 'kpi');
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

  // ── 1. Try Composio (user's personal Slack OAuth connection) ──────────────
  if (isComposioConfigured() && entityId) {
    const composioResult = await sendSlackMessage({
      channel: channel || '#general',
      text: messageText,
      entityId,
    });

    if (composioResult) {
      return { success: true, method: 'composio' };
    }
    // If Composio returned null (user hasn't connected Slack yet), fall through
  }

  // ── 2. Try Slack Bot Token (image upload) ────────────────────────────────
  if (env.SLACK_BOT_TOKEN) {
    const { WebClient } = await import('@slack/web-api');
    const client = new WebClient(env.SLACK_BOT_TOKEN);
    const targetChannel = channel || env.SLACK_DEFAULT_CHANNEL || 'general';

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await client.filesUploadV2({
      channel_id: targetChannel,
      file: buffer,
      filename: 'dashboard.png',
      title: `BizCopilot Dashboard — ${session.title || 'Report'}`,
      initial_comment: messageText,
    });

    return { success: true, method: 'slack-bot' };
  }

  // ── 3. Try Slack Incoming Webhook (text-only) ────────────────────────────
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
