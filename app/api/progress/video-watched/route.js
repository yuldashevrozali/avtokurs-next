import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Lesson from '@/models/Lesson';
import Progress from '@/models/Progress';

export async function POST(req) {
  await connectDB();
  const { user, error } = authRequired(req);
  if (error) return error;
  try {
    const { lessonId } = await req.json();
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return NextResponse.json({ message: 'Dars topilmadi' }, { status: 404 });
    await Progress.findOneAndUpdate(
      { userId: user.id, lessonId },
      { userId: user.id, lessonId, moduleId: lesson.moduleId, videoWatched: true },
      { upsert: true, new: true }
    );
    return NextResponse.json({ message: "Video ko'rildi" });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
