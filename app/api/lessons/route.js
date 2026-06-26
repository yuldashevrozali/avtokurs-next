import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import Lesson from '@/models/Lesson';

export async function POST(req) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    const body = await req.json();
    const lesson = await Lesson.create(body);
    return NextResponse.json(lesson, { status: 201 });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
