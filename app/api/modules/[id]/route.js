import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';

export async function PUT(req, { params }) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    const body = await req.json();
    const mod = await Module.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(mod);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    await Module.findByIdAndDelete(params.id);
    await Lesson.deleteMany({ moduleId: params.id });
    return NextResponse.json({ message: "Modul o'chirildi" });
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
