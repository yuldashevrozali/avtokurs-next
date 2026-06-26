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
    const { lessonId, answerIndex } = await req.json();
    const lesson = await Lesson.findById(lessonId);
    if (!lesson?.quiz) return NextResponse.json({ message: 'Quiz topilmadi' }, { status: 404 });
    const correct = lesson.quiz.correctIndex === answerIndex;
    const progress = await Progress.findOneAndUpdate(
      { userId: user.id, lessonId },
      { userId: user.id, lessonId, moduleId: lesson.moduleId, quizPassed: correct, quizScore: correct ? 100 : 0, completedAt: correct ? new Date() : undefined },
      { upsert: true, new: true }
    );
    return NextResponse.json({ correct, correctIndex: lesson.quiz.correctIndex, progress });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
