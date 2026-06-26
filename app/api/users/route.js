import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import User from '@/models/User';
import Progress from '@/models/Progress';

export async function GET(req) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    const result = await Promise.all(users.map(async u => {
      const completed = await Progress.countDocuments({ userId: u._id, quizPassed: true });
      return { ...u.toObject(), completedLessons: completed };
    }));
    return NextResponse.json(result);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
