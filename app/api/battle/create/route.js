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
  const { mode } = await req.json();
  if (!['friend', 'random'].includes(mode)) {
    return NextResponse.json({ message: 'Noto\'g\'ri rejim' }, { status: 400 });
  }
  await connectDB();
  const dbUser = await User.findById(user.id).select('name');
  const roomId = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const room = await Room.create({
    roomId,
    mode,
    questionIds: pick20(),
    p1: { userId: user.id, name: dbUser.name },
  });
  return NextResponse.json({ roomId: room.roomId });
}
