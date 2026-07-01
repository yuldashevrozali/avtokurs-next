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

  const amIn = room.players.some(p => p.userId === user.id);

  let questions = null;
  if (room.status !== 'waiting') {
    questions = room.questionIds.map(id => {
      const q = qMap[id];
      if (!q) return null;
      return { id: q.id, text: q.text, variants: q.variants, image_url: q.image_url || null };
    }).filter(Boolean);
  }

  const players = room.players.map(p => ({
    userId: p.userId,
    name: p.name,
    answeredCount: p.answeredCount,
    correctCount: p.correctCount,
    done: p.done,
    rank: p.rank,
  }));

  return NextResponse.json({
    roomId: room.roomId,
    mode: room.mode,
    maxPlayers: room.maxPlayers,
    status: room.status,
    amIn,
    myId: user.id,
    createdBy: room.createdBy,
    players,
    questions,
    winnerId: room.winnerId,
    startedAt: room.startedAt,
    createdAt: room.createdAt,
  });
}
