import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';

export async function POST(req, { params }) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();

  const room = await Room.findOne({ roomId: params.roomId });
  if (!room) return NextResponse.json({ message: 'Xona topilmadi' }, { status: 404 });
  if (room.status === 'finished') return NextResponse.json({ ok: true, alreadyDone: true });
  if (room.status !== 'playing') return NextResponse.json({ message: "O'yin boshlanmagan" }, { status: 400 });

  // Mark undone players as done with their current stats
  const updates = {};
  const now = new Date();
  room.players.forEach((p, i) => {
    if (!p.done) {
      updates[`players.${i}.done`] = true;
      updates[`players.${i}.finishedAt`] = now;
    }
  });

  if (Object.keys(updates).length > 0) {
    await Room.updateOne({ roomId: params.roomId }, { $set: updates });
  }

  const fresh = await Room.findOne({ roomId: params.roomId });
  const sorted = [...fresh.players].sort((a, b) => {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return (a.finishedAt || now) - (b.finishedAt || now);
  });

  const rankUpdates = {};
  const pointsOps = [];
  sorted.forEach((p, i) => {
    const pIdx = fresh.players.findIndex(fp => fp.userId === p.userId);
    rankUpdates[`players.${pIdx}.rank`] = i + 1;
    const pts = i === 0 ? 8 : i === 1 ? 2 : i === 2 ? 1 : -3;
    pointsOps.push(User.findByIdAndUpdate(p.userId, { $inc: { battlePoints: pts } }));
  });

  await Room.updateOne(
    { roomId: params.roomId },
    { $set: { status: 'finished', winnerId: sorted[0].userId, ...rankUpdates } },
  );
  await Promise.all(pointsOps);

  return NextResponse.json({ ok: true });
}
