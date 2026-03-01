import ChatSession from '../models/ChatSession.js';
import Message from '../models/Message.js';
import FinancialData from '../models/FinancialData.js';
import { streamAgent } from '../agent/index.js';
import { addChartToSession } from './dashboard.service.js';

export async function createSession(userId) {
  const session = await ChatSession.create({
    userId,
    title: 'New Chat',
    dashboardState: { charts: [] },
  });
  return session;
}

export async function getUserSessions(userId) {
  return ChatSession.find({ userId }).sort({ updatedAt: -1 }).lean();
}

export async function sendMessage({ sessionId, userId, content, user, res }) {
  const session = await ChatSession.findOne({ _id: sessionId, userId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  // Save user message
  await Message.create({ sessionId, role: 'user', content });

  // Update session title from first message
  const msgCount = await Message.countDocuments({ sessionId });
  if (msgCount === 1) {
    session.title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
    await session.save();
  }

  // Get user's datasets
  const dataSources = await FinancialData.find({ userId, status: 'ready' }).lean();

  // Link datasets to session
  if (dataSources.length > 0 && session.dataSourceIds.length === 0) {
    session.dataSourceIds = dataSources.map((ds) => ds._id);
    await session.save();
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const allToolCalls = [];

  try {
    const result = await streamAgent({
      userMessage: content,
      user,
      dataSources,
      sessionId,
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      },
      onToolCall: (tc) => {
        allToolCalls.push(tc);
        res.write(`data: ${JSON.stringify({ type: 'tool_call', toolName: tc.toolName, args: tc.args })}\n\n`);
      },
    });

    // Save charts to dashboard
    for (const chart of result.charts) {
      await addChartToSession(sessionId, chart);
    }

    // Save assistant message
    await Message.create({
      sessionId,
      role: 'assistant',
      content: result.content,
      toolCalls: allToolCalls,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', content: result.content })}\n\n`);
  } catch (error) {
    console.error('Agent error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Sorry, I encountered an error. Please try again.' })}\n\n`);
  }

  res.end();
}

export async function getSessionMessages(sessionId, userId) {
  const session = await ChatSession.findOne({ _id: sessionId, userId }).lean();
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  return Message.find({ sessionId }).sort({ createdAt: 1 }).lean();
}

export async function deleteSession(sessionId, userId) {
  const session = await ChatSession.findOneAndDelete({ _id: sessionId, userId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  await Message.deleteMany({ sessionId });
  return session;
}
