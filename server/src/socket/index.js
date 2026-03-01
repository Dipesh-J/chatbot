import jwt from 'jsonwebtoken';
import env from '../config/env.js';

let io;

export function initSocket(socketIo) {
  io = socketIo;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    console.log(`Socket connected: user ${userId}`);

    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
    });

    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${userId}`);
    });
  });
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitChartUpdate(sessionId, chart) {
  if (!io) return;
  io.to(`session:${sessionId}`).emit('dashboard:chart_update', chart);
}
