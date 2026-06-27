import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req, { params }) {
  const { error } = adminRequired(req);
  if (error) return error;
  await connectDB();
  await User.findByIdAndUpdate(params.id, { status: 'active' });
  return NextResponse.json({ ok: true });
}
