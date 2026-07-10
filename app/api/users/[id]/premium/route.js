import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import User from '@/models/User';

// Admin foydalanuvchini premium qiladi / bekor qiladi
export async function PUT(req, { params }) {
  const { error } = adminRequired(req);
  if (error) return error;
  await connectDB();
  try {
    const { isPremium } = await req.json();
    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ message: 'Topilmadi' }, { status: 404 });

    const willGrant = !!isPremium && !target.isPremium; // yangi premium bo'lyaptimi
    const update = { isPremium: !!isPremium };
    if (isPremium) {
      update.premiumRequested = false;            // so'rovni tozalaymiz
      if (willGrant) update.premiumCongrats = true; // tabrik ko'rsatiladi (1 marta)
    } else {
      update.premiumCongrats = false;
    }
    const user = await User.findByIdAndUpdate(params.id, update, { new: true }).select('-password');
    return NextResponse.json(user);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
