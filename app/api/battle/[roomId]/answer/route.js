import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';
import data from '@/base.json';

const qMap = {};
data.questions.forEach(q => { qMap[q.id] = q; });

function determineWinner(room) {
  const { p1, p2, startedAt } = room;
  if (p1.correctCount !== p2.correctCount) {
    return p1.correctCount > p2.correctCount ? p1.userId : p2.userId;
  }
  const t1 = (p1.finishedAt || new Date()) - startedAt;
  const t2 = (p2.finishedAt || new Date()) - startedAt;
  return t1 <= t2 ? p1.userId : p2.userId;
}

export async function POST(req, { params }) {
  const { user, error } = authRequired(req);
  if (error) return error;

  const { questionIdx, selectedIndex } = await req.json();
  if (typeof questionIdx !== 'number' || typeof selectedIndex !== 'number') {
    return NextResponse.json({ message: 'Noto\'g\'ri so\'rov' }, { status: 400 });
  }

  await connectDB();
  const room = await Room.findOne({ roomId: params.roomId });
  if (!room || room.status !== 'playing') {
    return NextResponse.json({ message: 'O\'yin topilmadi' }, { status: 400 });
  }

  const isP1 = room.p1.userId === user.id;
  const isP2 = room.p2?.userId === user.id;
  if (!isP1 && !isP2) return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 403 });

  const pKey = isP1 ? 'p1' : 'p2';
  const player = isP1 ? room.p1 : room.p2;

  if (player.done) return NextResponse.json({ message: 'Allaqachon tugagan' }, { status: 400 });

  const questionId = room.questionIds[questionIdx];
  const question = qMap[questionId];
  const isCorrect = question?.variants[selectedIndex]?.is_correct === true;

  const newAnswered = player.answeredCount + 1;
  const newCorrect = player.correctCount + (isCorrect ? 1 : 0);
  const isDone = newAnswered >= 20;

  const updates = {
    [`${pKey}.answeredCount`]: newAnswered,
    [`${pKey}.correctCount`]: newCorrect,
  };
  if (isDone) {
    updates[`${pKey}.done`] = true;
    updates[`${pKey}.finishedAt`] = new Date();
  }

  await Room.updateOne({ roomId: params.roomId }, { $set: updates });

  // Check if both done to finalize
  if (isDone) {
    const fresh = await Room.findOne({ roomId: params.roomId });
    if (fresh.p1.done && fresh.p2?.done) {
      const winnerId = determineWinner(fresh);
      const loserId = winnerId === fresh.p1.userId ? fresh.p2.userId : fresh.p1.userId;
      await Room.updateOne({ roomId: params.roomId }, { $set: { status: 'finished', winnerId } });
      await User.findByIdAndUpdate(winnerId, { $inc: { battlePoints: 5 } });
      await User.findByIdAndUpdate(loserId, { $inc: { battlePoints: -5 } });
    }
  }

  return NextResponse.json({ isCorrect, answeredCount: newAnswered, correctCount: newCorrect });
}
