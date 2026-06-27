import mongoose from 'mongoose';
const s = new mongoose.Schema({
  questionId: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});
export default mongoose.models.Note || mongoose.model('Note', s);
