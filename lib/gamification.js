'use client';
// Streak (kunlik faollik), statistika va achievements — barchasi localStorage'da,
// har bir foydalanuvchi uchun alohida. Backend talab qilmaydi.

function dayStr(d = new Date()) {
  // Mahalliy sana YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function uid() {
  try { return JSON.parse(localStorage.getItem('user') || '{}').id || null; }
  catch { return null; }
}

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Streak ──────────────────────────────────────────────
// Har kuni saytga kirsa/faol bo'lsa streak +1. Bir kun o'tkazib yuborsa 0 dan boshlanadi.
export function touchStreak(userId) {
  if (!userId) return { count: 0, best: 0 };
  const key = `streak_${userId}`;
  const s = read(key, { count: 0, best: 0, lastDay: null });
  const today = dayStr();
  if (s.lastDay === today) return s; // bugun allaqachon hisoblangan
  const yesterday = dayStr(addDays(new Date(), -1));
  s.count = s.lastDay === yesterday ? (s.count || 0) + 1 : 1;
  s.lastDay = today;
  s.best = Math.max(s.best || 0, s.count);
  write(key, s);
  return s;
}

export function getStreak(userId) {
  if (!userId) return { count: 0, best: 0 };
  const s = read(`streak_${userId}`, { count: 0, best: 0, lastDay: null });
  // Agar kecha ham, bugun ham kirmagan bo'lsa — streak uzilgan
  const today = dayStr();
  const yesterday = dayStr(addDays(new Date(), -1));
  if (s.lastDay !== today && s.lastDay !== yesterday) {
    return { ...s, count: 0 };
  }
  return s;
}

// ── Statistika (har bir javob) ──────────────────────────
export function recordAnswer(correct) {
  const userId = uid();
  if (!userId) return;
  const key = `stats_${userId}`;
  const s = read(key, {});
  s.solved = (s.solved || 0) + 1;
  if (correct) {
    s.correct = (s.correct || 0) + 1;
    s.curStreak = (s.curStreak || 0) + 1;
    s.bestStreak = Math.max(s.bestStreak || 0, s.curStreak);
  } else {
    s.curStreak = 0;
  }
  write(key, s);
}

export function recordExam(percent) {
  const userId = uid();
  if (!userId) return;
  const key = `stats_${userId}`;
  const s = read(key, {});
  s.examBest = Math.max(s.examBest || 0, Math.round(percent) || 0);
  write(key, s);
}

export function getStats(userId) {
  return read(`stats_${userId}`, {});
}

// ── Achievements ────────────────────────────────────────
const SIGNS_TOPICS = [4, 5, 6, 7, 8, 10, 13]; // "belgilar" mavzulari

function passedSignsTopics(userId) {
  let n = 0;
  for (const id of SIGNS_TOPICS) {
    const r = read(`topic_result_${userId}_${id}`, null);
    if (r && (r.percent ?? 0) >= 80) n++;
  }
  return n;
}

// Har bir achievement: check(stats, ctx) -> bool.
// t — tarjima obyekti (matnlar til bo'yicha).
export function getAchievements(userId, t) {
  const st = getStats(userId);
  const signsPassed = passedSignsTopics(userId);
  const defs = [
    { id: 'beginner', icon: '🟢', title: t.ach_beginner_t, desc: t.ach_beginner_d, done: (st.solved || 0) >= 1, progress: Math.min(st.solved || 0, 1), goal: 1 },
    { id: 'q100',     icon: '🔥', title: t.ach_q100_t,     desc: t.ach_q100_d,     done: (st.solved || 0) >= 100, progress: Math.min(st.solved || 0, 100), goal: 100 },
    { id: 'signs',    icon: '🧠', title: t.ach_signs_t,    desc: t.ach_signs_d,    done: signsPassed >= 5, progress: Math.min(signsPassed, 5), goal: 5 },
    { id: 'streak20', icon: '⚡', title: t.ach_streak20_t, desc: t.ach_streak20_d, done: (st.bestStreak || 0) >= 20, progress: Math.min(st.bestStreak || 0, 20), goal: 20 },
    { id: 'exam100',  icon: '👑', title: t.ach_exam100_t,  desc: t.ach_exam100_d,  done: (st.examBest || 0) >= 100, progress: Math.min(st.examBest || 0, 100), goal: 100 },
  ];
  return defs;
}
