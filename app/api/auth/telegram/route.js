import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createHash, createHmac, randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

const AUTH_MAX_AGE = 86400; // Telegram tasdig'i 1 kundan eski bo'lmasligi kerak

// Telegram Login Widget ma'lumotini bot token bilan tekshirish (soxta login'ni bloklaydi)
function verifyTelegram(data, token) {
  const { hash, ...rest } = data;
  if (!hash) return false;
  const dataCheckString = Object.keys(rest)
    .filter(k => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(token).digest();
  const hmac = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return hmac === hash;
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ message: 'Telegram sozlanmagan' }, { status: 500 });

    if (!verifyTelegram(body, token))
      return NextResponse.json({ message: "Telegram ma'lumoti tasdiqlanmadi" }, { status: 401 });

    if (Date.now() / 1000 - Number(body.auth_date) > AUTH_MAX_AGE)
      return NextResponse.json({ message: "Telegram sessiyasi eskirgan, qayta urinib ko'ring" }, { status: 401 });

    const tgId = String(body.id);
    const name = [body.first_name, body.last_name].filter(Boolean).join(' ') || body.username || 'Telegram user';

    let user = await User.findOne({ telegramId: tgId });
    if (!user) {
      user = await User.create({
        name,
        telegramId: tgId,
        tgUsername: body.username,
        photoUrl: body.photo_url,
        email: `tg${tgId}@telegram.local`,
        // Yangi Telegram foydalanuvchi admin tasdig'ini kutadi.
        // Tasdiqsiz darhol kirsin desangiz: 'pending' -> 'active'
        status: 'pending',
      });
    } else {
      user.name = name;
      user.tgUsername = body.username;
      user.photoUrl = body.photo_url;
      await user.save();
    }

    if (user.status === 'pending')
      return NextResponse.json({ pending: true, message: "Hisobingiz yaratildi! Admin tasdiqlashini kuting." });

    const sessionId = randomUUID();
    const userAgent = req.headers.get('user-agent') || "Noma'lum";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
             || req.headers.get('x-real-ip')
             || "Noma'lum";

    await User.findByIdAndUpdate(user._id, {
      sessionId,
      activeDevice: { userAgent, ip, loginAt: new Date(), lastSeenAt: new Date() },
    });

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const response = NextResponse.json({ token: jwtToken, user: { id: user._id, name: user.name, role: user.role } });
    response.cookies.set('avtokurs_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'Server xatosi' }, { status: 500 });
  }
}
