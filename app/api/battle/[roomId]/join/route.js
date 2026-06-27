import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';

export async function POST(req, { params }) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  const dbUser = await User.findById(user.id).select('name');

  const room = await Room.findOneAndUpdate(
    {
      roomId: params.roomId,
      status: 'waiting',
      mode: 'friend',
      'p1.userId': { $ne: user.id },
      p2: null,
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

  if (!room) return NextResponse.json({ message: "Xona topilmadi yoki to'la" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
