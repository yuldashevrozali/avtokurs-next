import mongoose from 'mongoose';
const s = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  videoWatched: { type: Boolean, default: false },
  quizPassed: { type: Boolean, default: false },
  quizScore: { type: Number, default: 0 },
  completedAt: Date
});
s.index({ userId: 1, lessonId: 1 }, { unique: true });
export default mongoose.models.Progress || mongoose.model('Progress', s);
