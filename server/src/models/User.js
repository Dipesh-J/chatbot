import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String },
    slackConfig: {
      webhookUrl: { type: String },
      channel: { type: String },
    },
  },
  { timestamps: true }
);

userSchema.index({ googleId: 1 }, { sparse: true });

export default mongoose.model('User', userSchema);
