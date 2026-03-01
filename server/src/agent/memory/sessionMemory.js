import Message from '../../models/Message.js';

const WINDOW_SIZE = 20;

export async function getSessionHistory(sessionId) {
  const messages = await Message.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(WINDOW_SIZE)
    .lean();

  return messages.reverse().map((msg) => {
    if (msg.role === 'user') return ['human', msg.content];
    if (msg.role === 'assistant') return ['ai', msg.content];
    return null;
  }).filter(Boolean);
}
