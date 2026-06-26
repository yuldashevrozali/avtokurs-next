import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { adminRequired } from '@/lib/auth';
import User from '@/models/User';

export async function PUT(req, { params }) {
  await connectDB();
  const { error } = adminRequired(req);
  if (error) return error;
  try {
    const { role } = await req.json();
    if (!['user','admin'].includes(role)) return NextResponse.json({ message: "Noto'g'ri rol" }, { status: 400 });
    const user = await User.findByIdAndUpdate(params.id, { role }, { new: true }).select('-password');
    return NextResponse.json(user);
  } catch { return NextResponse.json({ message: 'Server xatosi' }, { status: 500 }); }
}
