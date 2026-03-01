import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import connectDB from './config/db.js';
import './config/passport.js';
import { initSocket } from './socket/index.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import csvRoutes from './routes/csv.routes.js';
import chatRoutes from './routes/chat.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';
import composioRoutes from './routes/composio.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.NODE_ENV === 'production' ? false : env.CLIENT_URL,
    credentials: true,
  },
});

initSocket(io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/composio', composioRoutes);

// Serve static files in production
if (env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

// Start
const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
};

start();
