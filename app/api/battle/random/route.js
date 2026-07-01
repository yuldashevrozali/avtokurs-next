import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';
import data from '@/base.json';

function pick20() {
  const ids = data.questions.map(q => q.id);
  return [...ids].sort(() => Math.random() - 0.5).slice(0, 20);
}

export async function POST(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  const { maxPlayers = 2 } = await req.json().catch(() => ({}));
  const clampedMax = Math.min(Math.max(parseInt(maxPlayers) || 2, 2), 16);
  const dbUser = await User.findById(user.id).select('name');

  // Try to join an existing waiting random room with same maxPlayers
  const joined = await Room.findOneAndUpdate(
    {
      mode: 'random',
      status: 'waiting',
      maxPlayers: clampedMax,
      'players.userId': { $ne: user.id },
      $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] },
      createdAt: { $gte: new Date(Date.now() - 120000) },
    },
    { $push: { players: { userId: user.id, name: dbUser.name } } },
    { new: true },
  );

  if (joined) {
    // Auto-start if now full
    if (joined.players.length >= joined.maxPlayers) {
      await Room.updateOne(
        { roomId: joined.roomId },
        { $set: { status: 'playing', startedAt: new Date() } },
      );
    }
    return NextResponse.json({ roomId: joined.roomId });
  }

  // No matching room — create one and wait
  const roomId = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const room = await Room.create({
    roomId,
    mode: 'random',
    maxPlayers: clampedMax,
    questionIds: pick20(),
    questionSource: 'random',
    players: [{ userId: user.id, name: dbUser.name }],
    createdBy: user.id,
  });
  return NextResponse.json({ roomId: room.roomId });
}
