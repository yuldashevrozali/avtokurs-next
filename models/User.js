import mongoose from 'mongoose';
const s = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  sessionId: { type: String, default: null },
  activeDevice: {
    userAgent: String,
    ip: String,
    loginAt: Date,
    lastSeenAt: Date,
  },
});
export default mongoose.models.User || mongoose.model('User', s);
