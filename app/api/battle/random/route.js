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

  // Atomically claim an existing waiting random room
  const joined = await Room.findOneAndUpdate(
    {
      mode: 'random',
      status: 'waiting',
      'p1.userId': { $ne: user.id },
      createdAt: { $gte: new Date(Date.now() - 30000) },
    },
    {
      $set: {
        p2: { userId: user.id, name: dbUser.name, answeredCount: 0, correctCount: 0, done: false },
        status: 'playing',
        startedAt: new Date(),
      },
    },
    { new: true },
  );

  if (joined) return NextResponse.json({ roomId: joined.roomId, matched: true });

  // No room found — create one and wait
  const roomId = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const room = await Room.create({
    roomId,
    mode: 'random',
    questionIds: pick20(),
    p1: { userId: user.id, name: dbUser.name },
  });
  return NextResponse.json({ roomId: room.roomId, matched: false });
}
