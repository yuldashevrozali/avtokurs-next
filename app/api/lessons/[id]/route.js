import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authRequired, adminRequired } from '@/lib/auth';
import Lesson from '@/models/Lesson';

export async function GET(req, { params }) {
  await connectDB();
  const { error } = authRequired(req);
  if (error) return error;
  try {
    const lesson = await Lesson.findById(params.id);
    if (!lesson) return NextResponse.json({ message: 'Dars topilmadi' }, { status: 404 });
    return NextResponse.json(lesson);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    const body = await req.json();
    const lesson = await Lesson.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(lesson);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    await Lesson.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Dars o'chirildi" });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
