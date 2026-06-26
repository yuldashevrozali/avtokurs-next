import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function verifyToken(request) {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  try {
    return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function authRequired(request) {
  const user = verifyToken(request);
  if (!user) return { error: NextResponse.json({ message: "Token yo'q" }, { status: 401 }) };
  return { user };
}

export function adminRequired(request) {
  const { user, error } = authRequired(request);
  if (error) return { error };
  if (user.role !== 'admin') return { error: NextResponse.json({ message: 'Faqat admin uchun' }, { status: 403 }) };
  return { user };
}
