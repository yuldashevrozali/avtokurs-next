import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  await connectDB();
  try {
    const { name, email, password } = await req.json();
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ message: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return NextResponse.json({ message: 'Bu email allaqachon ro\'yxatdan o\'tgan' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed, status: 'pending' });
    return NextResponse.json({ pending: true, message: "Ro'yxatdan muvaffaqiyatli o'tdingiz! Admin tasdiqlashini kuting." });
  } catch {
    return NextResponse.json({ message: 'Server xatosi' }, { status: 500 });
  }
}
