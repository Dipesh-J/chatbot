import mongoose from 'mongoose';

const mcpToolSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    connectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connector', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['sql_query', 'sheets_read'], default: 'sql_query' },
    config: {
      query: { type: String, required: true },
      spreadsheetId: { type: String },
      parameters: [
        {
          name: String,
          type: { type: String, enum: ['string', 'number', 'date'] },
          description: String,
          required: Boolean,
        },
      ],
    },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mcpToolSchema.index({ userId: 1, enabled: 1 });

export default mongoose.model('McpTool', mcpToolSchema);
