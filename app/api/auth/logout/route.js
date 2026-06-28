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
  const response = NextResponse.json({ ok: true });
  response.cookies.set('avtokurs_token', '', { maxAge: 0, path: '/' });
  return response;
}
