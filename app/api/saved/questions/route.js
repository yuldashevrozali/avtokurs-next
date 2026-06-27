import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import SavedQuestion from '@/models/SavedQuestion';
import data from '@/base.json';

const qMap = {};
data.questions.forEach(q => { qMap[q.id] = q; });

// GET /api/saved/questions — saqlangan savollarning to'liq ma'lumoti
export async function GET(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  const saved = await SavedQuestion.find({ userId: user.id }).sort('-savedAt');
  const questions = saved
    .map(s => qMap[s.questionId])
    .filter(Boolean)
    .map(q => ({ id: q.id, text: q.text, variants: q.variants, image_url: q.image_url || null }));
  return NextResponse.json(questions);
}
