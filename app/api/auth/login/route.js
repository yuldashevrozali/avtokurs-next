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
    const { phone: rawId, password } = await req.json();
    const id = String(rawId || '').trim();
    if (!id || !password)
      return NextResponse.json({ message: 'Telefon va parol shart' }, { status: 400 });

    const phone = normalizePhone(id);
    // Telefon bo'yicha qidiramiz; admin uchun email ham ishlaydi
    const user = await User.findOne({ $or: [{ phone }, { email: id.toLowerCase() }] });
    if (!user || !user.password)
      return NextResponse.json({ message: 'Foydalanuvchi topilmadi' }, { status: 400 });
    if (!await bcrypt.compare(password, user.password))
      return NextResponse.json({ message: "Parol noto'g'ri" }, { status: 400 });

    const sessionId = randomUUID();
    const userAgent = req.headers.get('user-agent') || "Noma'lum";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || "Noma'lum";

    await User.findByIdAndUpdate(user._id, {
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
