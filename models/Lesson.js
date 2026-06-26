import mongoose from 'mongoose';
const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true }
});
const s = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  title: { type: String, required: true },
  description: String,
  youtubeId: { type: String, required: true },
  order: { type: Number, default: 0 },
  quiz: quizSchema,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.models.Lesson || mongoose.model('Lesson', s);
