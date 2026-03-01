import * as chatService from '../services/chat.service.js';

export async function createSession(req, res, next) {
  try {
    const session = await chatService.createSession(req.user._id);
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function getSessions(req, res, next) {
  try {
    const sessions = await chatService.getUserSessions(req.user._id);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    await chatService.sendMessage({
      sessionId: req.params.id,
      userId: req.user._id,
      content: content.trim(),
      user: req.user,
      res,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req, res, next) {
  try {
    const messages = await chatService.getSessionMessages(req.params.id, req.user._id);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    await chatService.deleteSession(req.params.id, req.user._id);
    res.json({ message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
}
