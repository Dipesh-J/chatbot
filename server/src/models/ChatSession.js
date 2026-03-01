import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Chat' },
    isActive: { type: Boolean, default: true },
    dataSourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FinancialData' }],
    dashboardState: {
      charts: [
        {
          id: String,
          type: { type: String, enum: ['bar', 'line', 'pie', 'area'] },
          title: String,
          config: mongoose.Schema.Types.Mixed,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatSession', chatSessionSchema);
