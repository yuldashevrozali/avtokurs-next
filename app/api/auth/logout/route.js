import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  const decoded = verifyToken(req);
  if (decoded) {
    await connectDB();
    await User.findByIdAndUpdate(decoded.id, { $unset: { sessionId: 1, activeDevice: 1 } });
  }
  return NextResponse.json({ ok: true });
}
