import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Progress from '@/models/Progress';

export async function GET(req, { params }) {
  await connectDB();
  const { user, error } = authRequired(req);
  if (error) return error;
  try {
    const progresses = await Progress.find({ userId: user.id, moduleId: params.moduleId });
    return NextResponse.json(progresses);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
