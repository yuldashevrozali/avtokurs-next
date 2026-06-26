import { NextResponse } from 'next/server';
import data from '@/base.json';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const count = Math.min(parseInt(searchParams.get('count') || '50'), 100);
  const pool = [...data.questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return NextResponse.json(pool.slice(0, count));
}
