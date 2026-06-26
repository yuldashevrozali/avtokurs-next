import { NextResponse } from 'next/server';
import data from '@/base.json';

export async function GET() {
  const tickets = data.tickets.map(t => ({
    id: t.id,
    number: t.number,
    questionCount: t.question_ids.length
  }));
  return NextResponse.json(tickets);
}
