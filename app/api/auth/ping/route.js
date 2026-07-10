import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  const decoded = verifyToken(req);
  if (!decoded) return NextResponse.json({ message: "Token noto'g'ri" }, { status: 401 });

  await connectDB();
  // Single query: match both _id and sessionId, update lastSeenAt atomically
  const user = await User.findOneAndUpdate(
    { _id: decoded.id, sessionId: decoded.sessionId },
    { 'activeDevice.lastSeenAt': new Date() },
    { new: true, select: 'name role isPremium premiumRequested' }
  );

  if (!user) {
    return NextResponse.json({ message: 'Boshqa qurilmadan kirildi' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: { id: user._id, name: user.name, role: user.role, isPremium: user.isPremium, premiumRequested: user.premiumRequested },
  });
}
