import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    content: { type: String, default: '' },
    toolCalls: [
      {
        toolName: String,
        args: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
      },
    ],
    metadata: {
      model: String,
      tokensUsed: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
