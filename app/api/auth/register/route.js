import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  await connectDB();
  try {
    const { name, email, password } = await req.json();
    if (await User.findOne({ email })) return NextResponse.json({ message: 'Email allaqachon mavjud' }, { status: 400 });
    const hashed = await bcrypt.hash(password, 10);

    const sessionId = randomUUID();
    const userAgent = req.headers.get('user-agent') || "Noma'lum";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
             || req.headers.get('x-real-ip')
             || "Noma'lum";

    const user = await User.create({
      name, email, password: hashed,
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
