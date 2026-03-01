import ChatSession from '../models/ChatSession.js';
import { emitChartUpdate } from '../socket/index.js';

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
