// Bepul (free) foydalanuvchi uchun ochiq kontent chegaralari
export const FREE_TICKET_ID = 1; // faqat 1-bilet
export const FREE_TOPIC_ID = 0;  // faqat "Umumiy qoidalar" mavzusi

// Premium huquqiga ega foydalanuvchi (admin ham hammasiga kira oladi)
export function isPremiumUser(user) {
  return !!user && (user.role === 'admin' || user.isPremium === true);
}

// Bilet ochiqmi?
export function canAccessTicket(user, ticketId) {
  return isPremiumUser(user) || String(ticketId) === String(FREE_TICKET_ID);
}

// Mavzu ochiqmi?
export function canAccessTopic(user, topicId) {
  return isPremiumUser(user) || String(topicId) === String(FREE_TOPIC_ID);
}
