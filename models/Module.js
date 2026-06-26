import mongoose from 'mongoose';
const s = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.models.Module || mongoose.model('Module', s);
