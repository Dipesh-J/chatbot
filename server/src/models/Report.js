import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
    title: { type: String, required: true },
    type: { type: String, enum: ['summary', 'strategy', 'analysis'], default: 'summary' },
    content: { type: String, required: true },
    highlights: [{ type: String }],
    sharedToSlack: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
