import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';
import data from '@/base.json';

function pick20() {
  const ids = data.questions.map(q => q.id);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 20);
}

export async function POST(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  const dbUser = await User.findById(user.id).select('name');

  // Try to join an existing waiting random room
  const joined = await Room.findOneAndUpdate(
    {
      mode: 'random',
      status: 'waiting',
      'players.userId': { $ne: user.id },
      $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] },
      createdAt: { $gte: new Date(Date.now() - 30000) },
    },
    {
      $push: { players: { userId: user.id, name: dbUser.name } },
      $set: { status: 'playing', startedAt: new Date() },
    },
    { new: true },
  );

  if (joined) return NextResponse.json({ roomId: joined.roomId, matched: true });

  // No room — create one and wait
  const roomId = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const room = await Room.create({
    roomId,
    mode: 'random',
    maxPlayers: 2,
    questionIds: pick20(),
    players: [{ userId: user.id, name: dbUser.name }],
    createdBy: user.id,
  });
  return NextResponse.json({ roomId: room.roomId, matched: false });
}
