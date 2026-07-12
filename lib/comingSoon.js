// "Tez orada" (coming soon) — vaqtincha qulflangan biletlar raqamlari.
// Bu ro'yxatdagi biletlar ro'yxatda "Tez orada" belgisi bilan chiqadi,
// ochib bo'lmaydi. Bilet tayyor bo'lganda shu ro'yxatdan olib tashlang.
export const COMING_SOON_TICKETS = [61, 62];

export function isComingSoon(ticketNumber) {
  return COMING_SOON_TICKETS.includes(Number(ticketNumber));
}
