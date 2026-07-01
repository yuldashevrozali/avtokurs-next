import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  name:         { type: String, required: true },
  answeredCount:{ type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  done:         { type: Boolean, default: false },
  finishedAt:   { type: Date },
  rank:         { type: Number, default: null },
}, { _id: false });

const schema = new mongoose.Schema({
  roomId:          { type: String, required: true, unique: true },
  mode:            { type: String, enum: ['friend', 'random'], required: true },
  maxPlayers:      { type: Number, default: 2, min: 2, max: 8 },
  questionIds:     [Number],
  questionSource:  { type: String, enum: ['random', 'topic', 'ticket'], default: 'random' },
  questionSourceId:{ type: Number, default: null },
  questionSourceName: { type: mongoose.Schema.Types.Mixed, default: null },
  status:          { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  players:    [playerSchema],
  createdBy:  { type: String, required: true },
  winnerId:   { type: String, default: null },
  startedAt:  { type: Date },
  createdAt:  { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model('Room', schema);
