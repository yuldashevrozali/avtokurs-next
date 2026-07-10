import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

function normalizePhone(p) {
  return String(p || '').replace(/[\s()\-]/g, '').trim();
}

export async function POST(req) {
  await connectDB();
  try {
    const { name, phone: rawPhone, password } = await req.json();
    const phone = normalizePhone(rawPhone);

    if (!name?.trim() || !phone || !password)
      return NextResponse.json({ message: "Ism, telefon va parol shart" }, { status: 400 });
    if (!/^\+?\d{7,15}$/.test(phone))
      return NextResponse.json({ message: "Telefon raqami noto'g'ri (masalan +998901234567)" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ message: "Parol kamida 6 ta belgi bo'lishi kerak" }, { status: 400 });

    if (await User.findOne({ phone }))
      return NextResponse.json({ message: "Bu telefon raqami allaqachon ro'yxatdan o'tgan" }, { status: 400 });

    const sessionId = randomUUID();
    const hashed = await bcrypt.hash(password, 10);
    const userAgent = req.headers.get('user-agent') || "Noma'lum";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || "Noma'lum";

    const user = await User.create({
      name: name.trim(),
      phone,
      email: `${phone}@phone.local`, // email indeksini qanoatlantirish uchun
      password: hashed,
      status: 'active',
      sessionId,
      activeDevice: { userAgent, ip, loginAt: new Date(), lastSeenAt: new Date() },
    });

    const token = jwt.sign({ id: user._id, role: user.role, sessionId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const response = NextResponse.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, isPremium: user.isPremium, premiumRequested: user.premiumRequested },
    });
    response.cookies.set('avtokurs_token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'Server xatosi' }, { status: 500 });
  }
}
