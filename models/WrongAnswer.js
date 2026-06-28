import mongoose from 'mongoose';
const s = new mongoose.Schema({
  userId:     { type: String, required: true },
  questionId: { type: Number, required: true },
  answeredAt: { type: Date, default: Date.now },
});
s.index({ userId: 1, answeredAt: -1 });
export default mongoose.models.WrongAnswer || mongoose.model('WrongAnswer', s);
