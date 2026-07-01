import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';

export async function POST(req, { params }) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();

  const room = await Room.findOne({ roomId: params.roomId });
  if (!room) return NextResponse.json({ message: 'Xona topilmadi' }, { status: 404 });
  if (room.status !== 'waiting') return NextResponse.json({ message: 'Allaqachon boshlangan' }, { status: 400 });
  if (room.createdBy !== user.id) return NextResponse.json({ message: 'Faqat xona egasi boshlashi mumkin' }, { status: 403 });
  if (room.players.length < 2) return NextResponse.json({ message: "Kamida 2 ta o'yinchi kerak" }, { status: 400 });

  await Room.updateOne(
    { roomId: params.roomId },
    { $set: { status: 'playing', startedAt: new Date() } },
  );
  return NextResponse.json({ ok: true });
}
