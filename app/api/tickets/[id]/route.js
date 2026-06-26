import { NextResponse } from 'next/server';
import data from '@/base.json';

const questionMap = {};
data.questions.forEach(q => { questionMap[q.id] = q; });

export async function GET(req, { params }) {
  const ticketId = parseInt(params.id);
  const ticket = data.tickets.find(t => t.id === ticketId);
  if (!ticket) return NextResponse.json({ message: 'Bilet topilmadi' }, { status: 404 });
  const questions = ticket.question_ids.map(id => questionMap[id]).filter(Boolean);
  return NextResponse.json({ ticket, questions });
}
