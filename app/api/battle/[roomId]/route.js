import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import data from '@/base.json';

const qMap = {};
data.questions.forEach(q => { qMap[q.id] = q; });

export async function GET(req, { params }) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();

  const room = await Room.findOne({ roomId: params.roomId });
  if (!room) return NextResponse.json({ message: 'Xona topilmadi' }, { status: 404 });

  const isP1 = room.p1.userId === user.id;
  const isP2 = room.p2?.userId === user.id;

  let questions = null;
  if (room.status !== 'waiting') {
    questions = room.questionIds.map(id => {
      const q = qMap[id];
      if (!q) return null;
      return { id: q.id, text: q.text, variants: q.variants, image_url: q.image_url || null };
    }).filter(Boolean);
  }

  const me = isP1 ? room.p1 : isP2 ? room.p2 : null;
  const opp = isP1 ? room.p2 : isP2 ? room.p1 : null;

  return NextResponse.json({
    roomId: room.roomId,
    mode: room.mode,
    status: room.status,
    amIn: isP1 || isP2,
    isP1,
    questions,
    me: me ? { name: me.name, answeredCount: me.answeredCount, correctCount: me.correctCount, done: me.done } : null,
    opponent: opp ? { name: opp.name, answeredCount: opp.answeredCount, correctCount: opp.correctCount, done: opp.done } : null,
    winnerId: room.winnerId,
    myId: user.id,
    p1: { name: room.p1.name, correctCount: room.p1.correctCount, answeredCount: room.p1.answeredCount, done: room.p1.done, finishedAt: room.p1.finishedAt },
    p2: room.p2 ? { name: room.p2.name, correctCount: room.p2.correctCount, answeredCount: room.p2.answeredCount, done: room.p2.done, finishedAt: room.p2.finishedAt } : null,
    startedAt: room.startedAt,
    createdAt: room.createdAt,
  });
}
