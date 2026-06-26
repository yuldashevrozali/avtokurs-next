import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Lesson from '@/models/Lesson';

export async function GET(req, { params }) {
  await connectDB();
  const { error } = authRequired(req);
  if (error) return error;
  try {
    const lessons = await Lesson.find({ moduleId: params.moduleId }).sort('order');
    return NextResponse.json(lessons);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
