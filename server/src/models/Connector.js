import mongoose from 'mongoose';

const connectorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['postgresql', 'mysql', 'google_sheets'], required: true },
    name: { type: String, required: true, trim: true },
    config: {
      encrypted: { type: String, required: true },
      iv: { type: String, required: true },
      authTag: { type: String, required: true },
    },
    dbSchema: {
      tables: [
        {
          name: String,
          columns: [
            {
              name: String,
              dataType: String,
              nullable: Boolean,
              isPrimaryKey: Boolean,
            },
          ],
          rowCount: Number,
        },
      ],
      spreadsheetId: String,
      lastIntrospectedAt: Date,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected',
    },
    lastTestedAt: Date,
    lastError: String,
  },
  { timestamps: true }
);

export default mongoose.model('Connector', connectorSchema);
