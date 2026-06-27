import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import Note from '@/models/Note';

export async function DELETE(req, { params }) {
  const { error } = adminRequired(req);
  if (error) return error;
  await connectDB();
  await Note.deleteOne({ questionId: Number(params.questionId) });
  return NextResponse.json({ ok: true });
}
