import mongoose from 'mongoose';
const s = new mongoose.Schema({
  userId:     { type: String, required: true },
  questionId: { type: Number, required: true },
  savedAt:    { type: Date, default: Date.now },
});
s.index({ userId: 1, questionId: 1 }, { unique: true });
export default mongoose.models.SavedQuestion || mongoose.model('SavedQuestion', s);
