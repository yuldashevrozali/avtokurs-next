import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  await connectDB();
  try {
    if (await User.findOne({ role: 'admin' })) return NextResponse.json({ message: 'Admin allaqachon mavjud' }, { status: 400 });
    const { email } = await req.json();
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) return NextResponse.json({ message: 'Foydalanuvchi topilmadi' }, { status: 404 });
    return NextResponse.json({ message: `${user.name} admin qilindi` });
  } catch {
    return NextResponse.json({ message: 'Server xatosi' }, { status: 500 });
  }
}
