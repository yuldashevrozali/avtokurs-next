import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  name:         { type: String, required: true },
  answeredCount:{ type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  done:         { type: Boolean, default: false },
  finishedAt:   { type: Date },
}, { _id: false });

const schema = new mongoose.Schema({
  roomId:      { type: String, required: true, unique: true },
  mode:        { type: String, enum: ['friend', 'random'], required: true },
  questionIds: [Number],
  status:      { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  p1:          { type: playerSchema, required: true },
  p2:          { type: playerSchema, default: null },
  winnerId:    { type: String, default: null },
  startedAt:   { type: Date },
  createdAt:   { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model('Room', schema);
