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
  const allIds = data.questions.map(q => q.id);
  return { ids: shuffle(allIds).slice(0, 20), sourceName: null };
}

export async function POST(req) {
  const { user, error } = authRequired(req);
  if (error) return error;
  await connectDB();

  const { maxPlayers = 2, source = { type: 'random' } } = await req.json().catch(() => ({}));
  const clampedMax = Math.min(Math.max(parseInt(maxPlayers) || 2, 2), 16);
  const sourceType = source?.type || 'random';
  const sourceId = source?.id ?? null;

  const dbUser = await User.findById(user.id).select('name');

  // Match rooms with same maxPlayers AND same question source
  const matchQuery = {
    mode: 'random',
    status: 'waiting',
    maxPlayers: clampedMax,
    questionSource: sourceType,
    'players.userId': { $ne: user.id },
    $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] },
    createdAt: { $gte: new Date(Date.now() - 120000) },
  };
  if (sourceType !== 'random') {
    matchQuery.questionSourceId = sourceId;
  }

  const joined = await Room.findOneAndUpdate(
    matchQuery,
    { $push: { players: { userId: user.id, name: dbUser.name } } },
    { new: true },
  );

  if (joined) {
    if (joined.players.length >= joined.maxPlayers) {
      await Room.updateOne(
        { roomId: joined.roomId },
        { $set: { status: 'playing', startedAt: new Date() } },
      );
    }
    return NextResponse.json({ roomId: joined.roomId });
  }

  // No matching room — create one
  const picked = pickQuestions(source);
  if (!picked) return NextResponse.json({ message: 'Manba topilmadi' }, { status: 400 });

  const roomId = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const room = await Room.create({
    roomId,
    mode: 'random',
    maxPlayers: clampedMax,
    questionIds: picked.ids,
    questionSource: sourceType,
    questionSourceId: sourceId,
    questionSourceName: picked.sourceName,
    players: [{ userId: user.id, name: dbUser.name }],
    createdBy: user.id,
  });
  return NextResponse.json({ roomId: room.roomId });
}
