import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import SavedQuestion from '@/models/SavedQuestion';

// GET /api/saved — foydalanuvchining saqlangan question ID lari
export async function GET(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  const saved = await SavedQuestion.find({ userId: user.id }).select('questionId').sort('-savedAt');
  return NextResponse.json(saved.map(s => s.questionId));
}

// POST /api/saved  { questionId }  — toggle (qo'sh yoki o'chir)
export async function POST(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ message: 'questionId shart' }, { status: 400 });
  await connectDB();

  const exists = await SavedQuestion.findOne({ userId: user.id, questionId });
  if (exists) {
    await SavedQuestion.deleteOne({ userId: user.id, questionId });
    return NextResponse.json({ saved: false });
  }
  await SavedQuestion.create({ userId: user.id, questionId });
  return NextResponse.json({ saved: true });
}
