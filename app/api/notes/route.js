import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired, verifyToken } from '@/lib/auth';
import Note from '@/models/Note';

// GET /api/notes?ids=1,2,3
export async function GET(req) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 401 });
  await connectDB();
  const idsParam = req.nextUrl.searchParams.get('ids') || '';
  const ids = idsParam.split(',').map(Number).filter(Boolean);
  if (!ids.length) return NextResponse.json([]);
  const notes = await Note.find({ questionId: { $in: ids } }).select('questionId text');
  return NextResponse.json(notes);
}

// POST /api/notes  { questionId, text }
export async function POST(req) {
  const { error } = adminRequired(req);
  if (error) return error;
  await connectDB();
  const { questionId, text } = await req.json();
  if (!questionId || !text?.trim()) return NextResponse.json({ message: 'questionId va text shart' }, { status: 400 });
  await Note.findOneAndUpdate(
    { questionId },
    { questionId, text: text.trim(), updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return NextResponse.json({ ok: true });
}
