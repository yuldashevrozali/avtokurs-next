import { NextResponse } from 'next/server';
import data from '@/base.json';

const questionMap = {};
data.questions.forEach(q => { questionMap[q.id] = q; });

export async function GET(req, { params }) {
  const topicId = parseInt(params.id);
  const topic = data.topics.find(t => t.id === topicId);
  if (!topic) return NextResponse.json({ message: 'Mavzu topilmadi' }, { status: 404 });
  const questions = topic.question_ids.map(id => questionMap[id]).filter(Boolean);
  return NextResponse.json({ topic, questions });
}
