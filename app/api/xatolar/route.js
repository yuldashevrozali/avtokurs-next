import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import WrongAnswer from '@/models/WrongAnswer';
import data from '@/base.json';

const questionMap = new Map(data.questions.map(q => [q.id, q]));

// GET /api/xatolar — oxirgi 20 ta xato qilingan savollar (unique)
export async function GET(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();

  const wrongs = await WrongAnswer.find({ userId: user.id })
    .sort({ answeredAt: -1 })
    .limit(200)
    .select('questionId');

  const seen = new Set();
  const ids = [];
  for (const w of wrongs) {
    if (!seen.has(w.questionId)) {
      seen.add(w.questionId);
      ids.push(w.questionId);
      if (ids.length >= 20) break;
    }
  }

  const questions = ids.map(id => questionMap.get(id)).filter(Boolean);
  return NextResponse.json(questions);
}

// POST /api/xatolar — xato javob yozib qo'yish
export async function POST(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ ok: false }, { status: 400 });
  await connectDB();
  await WrongAnswer.create({ userId: user.id, questionId });
  return NextResponse.json({ ok: true });
}
