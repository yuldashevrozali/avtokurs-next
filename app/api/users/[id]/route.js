import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import User from '@/models/User';
import Progress from '@/models/Progress';

export async function DELETE(req, { params }) {
  await connectDB();
  const { user, error } = adminRequired(req);
  if (error) return error;
  if (user.id === params.id) return NextResponse.json({ message: "O'zingizni o'chira olmaysiz" }, { status: 400 });
  try {
    await User.findByIdAndDelete(params.id);
    await Progress.deleteMany({ userId: params.id });
    return NextResponse.json({ message: "Foydalanuvchi o'chirildi" });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
