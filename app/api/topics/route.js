import { NextResponse } from 'next/server';
import data from '@/base.json';

export async function GET() {
  const topics = data.topics.map(t => ({
    id: t.id,
    name: t.name,
    questionCount: t.question_ids.length
  }));
  return NextResponse.json(topics);
}
