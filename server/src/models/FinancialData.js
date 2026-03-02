import mongoose from 'mongoose';

const financialDataSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    fileName: { type: String, required: true },
    columns: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ['string', 'number', 'date'], default: 'string' },
      },
    ],
    rowCount: { type: Number, default: 0 },
    dateRange: {
      start: { type: Date },
      end: { type: Date },
    },
    rows: [{ type: mongoose.Schema.Types.Mixed }],
    summary: {
      totalRevenue: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      monthlyBreakdown: [
        {
          month: String,
          revenue: Number,
          expenses: Number,
          profit: Number,
        },
      ],
    },
    status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
  },
  { timestamps: true }
);

export default mongoose.model('FinancialData', financialDataSchema);
