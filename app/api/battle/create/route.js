import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { authRequired } from '@/lib/auth';
import Room from '@/models/Room';
import User from '@/models/User';
import data from '@/base.json';

const topicMap = {};
data.topics.forEach(t => { topicMap[t.id] = t; });
const ticketMap = {};
data.tickets.forEach(t => { ticketMap[t.id] = t; });

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickQuestions(source) {
  if (source?.type === 'topic') {
    const topic = topicMap[source.id];
    if (!topic) return null;
    const ids = shuffle(topic.question_ids).slice(0, 20);
    return { ids, sourceName: topic.name };
  }
  if (source?.type === 'ticket') {
    const ticket = ticketMap[source.id];
    if (!ticket) return null;
    return { ids: ticket.question_ids, sourceName: { uz: `Bilet #${ticket.number}`, uz_cryl: `Билет #${ticket.number}` } };
  }
  // random
  const allIds = data.questions.map(q => q.id);
  return { ids: shuffle(allIds).slice(0, 20), sourceName: null };
}

export async function POST(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  const { mode, maxPlayers = 2, source = { type: 'random' } } = await req.json();
  if (!['friend', 'random'].includes(mode)) {
    return NextResponse.json({ message: "Noto'g'ri rejim" }, { status: 400 });
  }
  const clampedMax = Math.min(Math.max(parseInt(maxPlayers) || 2, 2), 16);

  const picked = pickQuestions(source);
  if (!picked) return NextResponse.json({ message: "Manba topilmadi" }, { status: 400 });

  await connectDB();
  const dbUser = await User.findById(user.id).select('name');
  const roomId = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const room = await Room.create({
    roomId,
    mode,
    maxPlayers: clampedMax,
    questionIds: picked.ids,
    questionSource: source.type || 'random',
    questionSourceId: source.id ?? null,
    questionSourceName: picked.sourceName,
    players: [{ userId: user.id, name: dbUser.name }],
    createdBy: user.id,
  });
  return NextResponse.json({ roomId: room.roomId });
}
