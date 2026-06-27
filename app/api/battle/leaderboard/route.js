import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  await connectDB();
  const users = await User.find({ battlePoints: { $exists: true } })
    .sort({ battlePoints: -1 })
    .limit(10)
    .select('name battlePoints');
  return NextResponse.json(users);
}
