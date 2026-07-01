import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';
import data from '@/base.json';

const qMap = {};
data.questions.forEach(q => { qMap[q.id] = q; });

export async function POST(req, { params }) {
  const { user, error } = authRequired(req);
  if (error) return error;

  const { questionIdx, selectedIndex } = await req.json();
  if (typeof questionIdx !== 'number' || typeof selectedIndex !== 'number') {
    return NextResponse.json({ message: "Noto'g'ri so'rov" }, { status: 400 });
  }

  await connectDB();
  const room = await Room.findOne({ roomId: params.roomId });
  if (!room || room.status !== 'playing') {
    return NextResponse.json({ message: "O'yin topilmadi" }, { status: 400 });
  }

  const playerIdx = room.players.findIndex(p => p.userId === user.id);
  if (playerIdx === -1) return NextResponse.json({ message: "Ruxsat yo'q" }, { status: 403 });

  const player = room.players[playerIdx];
  if (player.done) return NextResponse.json({ message: 'Allaqachon tugagan' }, { status: 400 });

  const questionId = room.questionIds[questionIdx];
  const question = qMap[questionId];
  const isCorrect = question?.variants[selectedIndex]?.is_correct === true;

  const newAnswered = player.answeredCount + 1;
  const newCorrect = player.correctCount + (isCorrect ? 1 : 0);
  const totalQuestions = room.questionIds.length;
  const isDone = newAnswered >= totalQuestions;

  const updates = {
    [`players.${playerIdx}.answeredCount`]: newAnswered,
    [`players.${playerIdx}.correctCount`]: newCorrect,
  };
  if (isDone) {
    updates[`players.${playerIdx}.done`] = true;
    updates[`players.${playerIdx}.finishedAt`] = new Date();
  }

  await Room.updateOne({ roomId: params.roomId }, { $set: updates });

  if (isDone) {
    const fresh = await Room.findOne({ roomId: params.roomId });
    const allDone = fresh.players.every(p => p.done);
    if (allDone) {
      const sorted = [...fresh.players].sort((a, b) => {
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
        return (a.finishedAt || new Date()) - (b.finishedAt || new Date());
      });

      const rankUpdates = {};
      let pointsOps = [];
      sorted.forEach((p, i) => {
        const rank = i + 1;
        const pIdx = fresh.players.findIndex(fp => fp.userId === p.userId);
        rankUpdates[`players.${pIdx}.rank`] = rank;
        const pts = rank === 1 ? 8 : rank === 2 ? 2 : rank === 3 ? 1 : -3;
        pointsOps.push(User.findByIdAndUpdate(p.userId, { $inc: { battlePoints: pts } }));
      });

      await Room.updateOne(
        { roomId: params.roomId },
        { $set: { status: 'finished', winnerId: sorted[0].userId, ...rankUpdates } },
      );
      await Promise.all(pointsOps);
    }
  }

  return NextResponse.json({ isCorrect, answeredCount: newAnswered, correctCount: newCorrect, totalQuestions });
}
