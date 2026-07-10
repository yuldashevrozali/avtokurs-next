import mongoose from 'mongoose';
const s = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true, trim: true }, // telefon orqali kirish
  password: { type: String }, // Telegram orqali kirganlarda parol bo'lmaydi
  telegramId: { type: String, unique: true, sparse: true }, // Telegram user id
  tgUsername: { type: String },
  photoUrl: { type: String },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  isPremium: { type: Boolean, default: false }, // premium (barcha bo'limlar)
  premiumRequested: { type: Boolean, default: false }, // premium so'rov yuborganmi
  premiumRequestedAt: { type: Date },
  premiumCongrats: { type: Boolean, default: false }, // premium bo'lgani haqida tabrik ko'rsatilishi kerakmi (1 marta)
  createdAt: { type: Date, default: Date.now },
  battlePoints: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'active'] }, // undefined = mavjud (faol) userlar
  sessionId: { type: String, default: null },
  activeDevice: {
    userAgent: String,
    ip: String,
    loginAt: Date,
    lastSeenAt: Date,
  },
});
export default mongoose.models.User || mongoose.model('User', s);
