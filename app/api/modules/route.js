import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired, adminRequired } from '@/lib/auth';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import Progress from '@/models/Progress';

export async function GET(req) {
  await connectDB();
  const { user, error } = authRequired(req);
  if (error) return error;
  try {
    const modules = await Module.find({ isPublished: true }).sort('order');
    const result = await Promise.all(modules.map(async (mod) => {
      const lessons = await Lesson.find({ moduleId: mod._id });
      const total = lessons.length;
      if (!total) return { ...mod.toObject(), percent: 0, totalLessons: 0, completedLessons: 0 };

      const progresses = await Progress.find({ userId: user.id, moduleId: mod._id });
      const progMap = {};
      progresses.forEach(p => { progMap[String(p.lessonId)] = p; });

      let completedCount = 0;
      for (const lesson of lessons) {
        const prog = progMap[String(lesson._id)];
        if (!prog) continue;
        if (lesson.quiz) {
          if (prog.quizPassed) completedCount++;
        } else {
          if (prog.videoWatched) completedCount++;
        }
      }

      return {
        ...mod.toObject(),
        percent: Math.round((completedCount / total) * 100),
        totalLessons: total,
        completedLessons: completedCount
      };
    }));
    return NextResponse.json(result);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}

export async function POST(req) {
  await connectDB();
  const { user, error } = adminRequired(req);
  if (error) return error;
  try {
    const { title, description, order } = await req.json();
    const mod = await Module.create({ title, description, order });
    return NextResponse.json(mod, { status: 201 });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
