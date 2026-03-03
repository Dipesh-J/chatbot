import connectDB from './config/db.js';
import User from './models/User.js';
import { sendSlackMessage } from './services/composio.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await connectDB();
  const user = await User.findOne({ email: 'dipeshjoshi015@gmail.com' });
  if (!user) {
    console.log("User not found");
    process.exit(0);
  }
  console.log("User ID:", user._id.toString());
  
  const result = await sendSlackMessage({
    channel: '#general',
    text: 'Test message from script',
    entityId: user._id.toString()
  });
  console.log("Send Result:", result);
  process.exit(0);
}
run();
