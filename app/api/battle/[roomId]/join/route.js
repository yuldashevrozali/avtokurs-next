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
  if (room.status !== 'waiting') return NextResponse.json({ message: "O'yin boshlangan" }, { status: 400 });
  if (room.players.some(p => p.userId === user.id)) {
    return NextResponse.json({ ok: true, alreadyIn: true });
  }
  if (room.players.length >= room.maxPlayers) {
    return NextResponse.json({ message: "Xona to'la" }, { status: 400 });
  }

  const dbUser = await User.findById(user.id).select('name');
  await Room.updateOne(
    { roomId: params.roomId },
    { $push: { players: { userId: user.id, name: dbUser.name } } },
  );

  // Auto-start if room is full (random mode or friend mode with exact count)
  const fresh = await Room.findOne({ roomId: params.roomId });
  if (fresh.players.length >= fresh.maxPlayers && fresh.mode === 'random') {
    await Room.updateOne(
      { roomId: params.roomId },
      { $set: { status: 'playing', startedAt: new Date() } },
    );
  }

  return NextResponse.json({ ok: true });
}
