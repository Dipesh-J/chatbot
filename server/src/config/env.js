import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bizcopilot',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_DEFAULT_CHANNEL: process.env.SLACK_DEFAULT_CHANNEL,
  COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`,
  CONNECTOR_ENCRYPTION_KEY: process.env.CONNECTOR_ENCRYPTION_KEY,
};

export default env;
