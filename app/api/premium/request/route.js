import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import User from '@/models/User';

// Foydalanuvchi premium so'rov yuboradi
export async function POST(req) {
  const { user: decoded, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  await User.findByIdAndUpdate(decoded.id, { premiumRequested: true, premiumRequestedAt: new Date() });
  return NextResponse.json({ ok: true });
}
