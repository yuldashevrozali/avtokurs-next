import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  await connectDB();
  try {
    const { email, password } = await req.json();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'Foydalanuvchi topilmadi' }, { status: 400 });
    if (!await bcrypt.compare(password, user.password)) return NextResponse.json({ message: "Parol noto'g'ri" }, { status: 400 });
    if (user.status === 'pending') return NextResponse.json({ message: "Hisobingiz hali tasdiqlanmagan. Admin bilan bog'laning." }, { status: 403 });

    const sessionId = randomUUID();
    const userAgent = req.headers.get('user-agent') || "Noma'lum";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
             || req.headers.get('x-real-ip')
             || "Noma'lum";

    await User.findByIdAndUpdate(user._id, {
      sessionId,
      activeDevice: { userAgent, ip, loginAt: new Date(), lastSeenAt: new Date() },
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return NextResponse.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch {
    return NextResponse.json({ message: 'Server xatosi' }, { status: 500 });
  }
}
