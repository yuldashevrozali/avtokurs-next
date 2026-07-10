import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import User from '@/models/User';

// Premium tabrigi ko'rsatildi — flagni o'chiramiz (boshqa ko'rinmasin)
export async function POST(req) {
  const { user: decoded, error } = authRequired(req);
  if (error) return error;
  await connectDB();
  await User.findByIdAndUpdate(decoded.id, { premiumCongrats: false });
  return NextResponse.json({ ok: true });
}
