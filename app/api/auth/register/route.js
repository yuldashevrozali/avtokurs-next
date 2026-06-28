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
    if (password.length < 8)
      return NextResponse.json({ message: "Parol kamida 8 ta belgi bo'lishi kerak" }, { status: 400 });
    if (!/[A-Z]/.test(password))
      return NextResponse.json({ message: 'Parolda kamida 1 ta katta harf (A-Z) bo\'lishi kerak' }, { status: 400 });
    if (!/[a-z]/.test(password))
      return NextResponse.json({ message: "Parolda kamida 1 ta kichik harf (a-z) bo'lishi kerak" }, { status: 400 });
    if (!/[0-9]/.test(password))
      return NextResponse.json({ message: "Parolda kamida 1 ta raqam bo'lishi kerak" }, { status: 400 });
    if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password))
      return NextResponse.json({ message: "Parolda kamida 1 ta maxsus belgi bo'lishi kerak (!@#$%^&* va h.k.)" }, { status: 400 });
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
