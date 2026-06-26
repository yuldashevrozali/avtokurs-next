import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import Module from '@/models/Module';

export async function GET(req) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    const modules = await Module.find().sort('order');
    return NextResponse.json(modules);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
