'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export const LangContext = createContext({ lang: 'uz', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('uz');
  useEffect(() => {
    const s = localStorage.getItem('lang');
    if (s === 'uz_cryl') setLangState('uz_cryl');
  }, []);
  function setLang(l) { localStorage.setItem('lang', l); setLangState(l); }
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }

export const T = {
  uz: {
    // Nav
    topics: 'Mavzular', tickets: 'Biletlar', exam: 'Imtihon', videos: 'Video darslar',
    game: "Haydash o'yini", saved: '🔖 Saqlangan', battle: '⚔️ 1vs1',
    login: 'Kirish', logout: 'Chiqish', admin: 'Admin',
    // Common
    loading: 'Yuklanmoqda...', next_q: 'Keyingi savol', see_result: "Natijani ko'rish",
    correct: "To'g'ri javob!", wrong: "Noto'g'ri", restart: 'Qayta urinish',
    correct_l: "To'g'ri", wrong_l: "Noto'g'ri", total_l: 'Jami', cancel: 'Bekor qilish',
    // Login
    login_tab: 'Kirish', reg_tab: "Ro'yxatdan o'tish",
    name_l: 'Ism', password_l: 'Parol', admin_setup: 'Admin sozlash',
    kicked: 'Hisobingizga boshqa qurilmadan kirildi. Iltimos, qayta kiring.',
    pending_done: "Ro'yxatdan o'tdingiz!", pending_msg: "Hisobingiz admin tomonidan tasdiqlanishi kerak. Tasdiqlangandan so'ng tizimga kirishingiz mumkin.",
    go_login: "Kirishga o'tish",
    // Mavzular
    topics_title: "Mavzular bo'yicha test", topics_sub: "Har bir mavzuni alohida o'rganing",
    topics_total: 'Jami mavzular', topics_done: 'Yakunlangan', topics_qs: 'Jami savollar',
    search_ph: 'Mavzu nomini qidiring...',
    not_done: "Hali o'tilmagan", btn_restart: 'Qayta', btn_continue: 'Davom', btn_start: 'Boshlash',
    q_count: 'ta savol',
    // Topic test
    back_topics: "Mavzularga qaytish", congrats: 'Tabriklaymiz!', study_more: "Yana o'qing",
    // Biletlar
    tickets_title: 'Biletlar', tickets_sub: 'Har bir biletda 20 ta savol — rasmiy imtihon shakli',
    ticket_l: 'Bilet', done_l: 'Bajarildi', back_tickets: 'Biletlarga qaytish',
    tickets_total: 'Jami biletlar', tickets_done_pct: 'Yakunlangan (80%+)', q_per_ticket: 'Savol soni',
    results_l: 'Natijalar',
    // Imtihon
    exam_title: 'Imtihon rejimi', exam_sub: "Tasodifiy savollar bilan o'zingizni sinab ko'ring",
    exam_prep: 'Savollar tayyorlanmoqda...', exam_great: 'Ajoyib natija!',
    exam_more: "Ko'proq mashq qiling", exam_restart: 'Qayta boshlash', finish: 'Yakunlash',
    timer_warn: 'Vaqt tugaganda imtihon avtomatik yakunlanadi',
    answered: 'javob berildi', unanswered: 'Javobsiz', min_l: 'daqiqa', pass_l: "O'tish: 80%",
    // Saved
    saved_title: '🔖 Saqlangan savollar', saved_qs: 'ta savol saqlangan',
    saved_empty_t: 'Hech narsa saqlanmagan',
    saved_empty_s: "Test yechayotganda 🔖 belgisini bosib savollarni saqlang",
    go_topics: "Mavzularga o'tish", start_test: '▶ Test boshlash', back_list: "Ro'yxatga qaytish",
    // Notes
    note_l: 'Izoh', note_add: "Izoh qo'shish", note_edit: "Izohni tahrirlash",
    note_save: 'Saqlash', note_del: "O'chirish", note_saving: 'Saqlanmoqda...',
    note_ph: "Bu savol bo'yicha izoh yozing...", note_del_confirm: "Izohni o'chirasizmi?",
    // Battle
    battle_title: '⚔️ 1 vs 1 Raqobat', battle_sub: "Do'stingiz bilan yoki random raqib bilan kurashing",
    friend_mode: 'Sherik bilan', friend_desc: "Havolani do'stingizga yuboring",
    random_mode: 'Random', random_desc: 'Tasodifiy raqib bilan',
    share_title: 'Havolani yuboring', share_sub: "Do'stingiz havolani ochsa, o'yin boshlanadi",
    copy_l: 'Nusxalash', copied_l: '✓ Nusxalandi', go_game: "O'yinga kirish →",
    searching: 'Raqobatchi axtarilmoqda...', searching_sub: "30 soniya ichida topilmasa bekor bo'ladi",
    not_found: 'Raqobatchi topilmadi', not_found_s: "Hozir boshqa foydalanuvchi yo'q. Keyinroq urinib ko'ring.",
    retry_l: 'Qayta urinish', top_players: "Eng yaxshi o'yinchilar", no_games: "Hali o'yinlar bo'lmagan",
    pts_l: 'ochko', waiting_friend: "Do'stingizni kutmoqda...",
    waiting_sub: "Havolani do'stingizga yuboring. U kirgach o'yin boshlanadi.",
    copy_short: 'Nusxa', opp_wait: 'Raqib kutilmoqda...',
    you_won: 'Siz yutdingiz!', you_lost: 'Siz yutqazdingiz',
    pts_plus: "+5 ochko qo'shildi", pts_minus: '−5 ochko ayirildi',
    you_l: '👤 Siz', opp_l: '👤 Raqib', home_l: 'Bosh sahifa',
    rematch: "Qayta o'ynash", tie_note: '* Teng natija — tezroq tugallagan yutdi',
    joining: "O'yinga qo'shilmoqda...", room_404: 'Xona topilmadi',
    room_full: "Bu xona to'la yoki mavjud emas", back_battle: 'Raqobatga qaytish',
    wait_done: 'Raqib tugashini kutmoqda...', q_l: 'Savol',
    // Modules
    videos_title: 'Video darsliklar',
    videos_sub_admin: "Modullarni boshqaring va darslar qo'shing",
    videos_sub_user: "Modulni tanlang va o'rganishni boshlang",
    no_modules: "Hozircha modul yo'q",
    lessons_l: 'Darslar', add_lesson: '+ Dars qo\'sh', no_lessons: "Hali dars qo'shilmagan",
    completed_pct: 'yakunlangan', lessons_count: 'dars',
    btn_review: "Qayta ko'rish", btn_cont: 'Davom etish',
  },
  uz_cryl: {
    // Nav
    topics: 'Мавзулар', tickets: 'Билетлар', exam: 'Имтиҳон', videos: 'Видео дарслар',
    game: 'Ҳайдаш ўйини', saved: '🔖 Сақланган', battle: '⚔️ 1vs1',
    login: 'Кириш', logout: 'Чиқиш', admin: 'Админ',
    // Common
    loading: 'Юкланмоқда...', next_q: 'Кейинги савол', see_result: 'Натижани кўриш',
    correct: 'Тўғри жавоб!', wrong: 'Нотўғри', restart: 'Қайта уриниш',
    correct_l: 'Тўғри', wrong_l: 'Нотўғри', total_l: 'Жами', cancel: 'Бекор қилиш',
    // Login
    login_tab: 'Кириш', reg_tab: 'Рўйхатдан ўтиш',
    name_l: 'Исм', password_l: 'Парол', admin_setup: 'Админ созлаш',
    kicked: 'Ҳисобингизга бошқа қурилмадан кирилди. Илтимос, қайта киринг.',
    pending_done: 'Рўйхатдан ўтдингиз!', pending_msg: 'Ҳисобингиз админ томонидан тасдиқланиши керак. Тасдиқлангандан сўнг тизимга киришингиз мумкин.',
    go_login: 'Киришга ўтиш',
    // Mavzular
    topics_title: 'Мавзулар бўйича тест', topics_sub: 'Ҳар бир мавзуни алоҳида ўрганинг',
    topics_total: 'Жами мавзулар', topics_done: 'Якунланган', topics_qs: 'Жами саволлар',
    search_ph: 'Мавзу номини қидиринг...',
    not_done: 'Ҳали ўтилмаган', btn_restart: 'Қайта', btn_continue: 'Давом', btn_start: 'Бошлаш',
    q_count: 'та савол',
    // Topic test
    back_topics: 'Мавзуларга қайтиш', congrats: 'Табриклаймиз!', study_more: 'Яна ўқинг',
    // Biletlar
    tickets_title: 'Билетлар', tickets_sub: 'Ҳар бир билетда 20 та савол — расмий имтиҳон шакли',
    ticket_l: 'Билет', done_l: 'Бажарилди', back_tickets: 'Билетларга қайтиш',
    tickets_total: 'Жами билетлар', tickets_done_pct: 'Якунланган (80%+)', q_per_ticket: 'Савол сони',
    results_l: 'Натижалар',
    // Imtihon
    exam_title: 'Имтиҳон режими', exam_sub: 'Тасодифий саволлар билан ўзингизни синаб кўринг',
    exam_prep: 'Саволлар тайёрланмоқда...', exam_great: 'Ажойиб натижа!',
    exam_more: 'Кўпроқ машқ қилинг', exam_restart: 'Қайта бошлаш', finish: 'Якунлаш',
    timer_warn: 'Вақт тугаганда имтиҳон автоматик якунланади',
    answered: 'жавоб берилди', unanswered: 'Жавобсиз', min_l: 'дақиқа', pass_l: 'Ўтиш: 80%',
    // Saved
    saved_title: '🔖 Сақланган саволлар', saved_qs: 'та савол сақланган',
    saved_empty_t: 'Ҳеч нарса сақланмаган',
    saved_empty_s: 'Тест ечаётганда 🔖 белгисини босиб саволларни сақланг',
    go_topics: 'Мавзуларга ўтиш', start_test: '▶ Тест бошлаш', back_list: 'Рўйхатга қайтиш',
    // Notes
    note_l: 'Изоҳ', note_add: 'Изоҳ қўшиш', note_edit: 'Изоҳни таҳрирлаш',
    note_save: 'Сақлаш', note_del: 'Ўчириш', note_saving: 'Сақланмоқда...',
    note_ph: 'Бу савол бўйича изоҳ ёзинг...', note_del_confirm: 'Изоҳни ўчирасизми?',
    // Battle
    battle_title: '⚔️ 1 vs 1 Рақобат', battle_sub: 'Дўстингиз билан ёки рандом рақиб билан курашинг',
    friend_mode: 'Шерик билан', friend_desc: 'Ҳаволани дўстингизга юборинг',
    random_mode: 'Рандом', random_desc: 'Тасодифий рақиб билан',
    share_title: 'Ҳаволани юборинг', share_sub: 'Дўстингиз ҳаволани очса, ўйин бошланади',
    copy_l: 'Нусхалаш', copied_l: '✓ Нусхаланди', go_game: 'Ўйинга кириш →',
    searching: 'Рақобатчи ахтарилмоқда...', searching_sub: '30 сония ичида топилмаса бекор бўлади',
    not_found: 'Рақобатчи топилмади', not_found_s: 'Ҳозир бошқа фойдаланувчи йўқ. Кейинроқ уриниб кўринг.',
    retry_l: 'Қайта уриниш', top_players: 'Энг яхши ўйинчилар', no_games: 'Ҳали ўйинлар бўлмаган',
    pts_l: 'очко', waiting_friend: 'Дўстингизни кутмоқда...',
    waiting_sub: 'Ҳаволани дўстингизга юборинг. У кирганда ўйин бошланади.',
    copy_short: 'Нусха', opp_wait: 'Рақиб кутилмоқда...',
    you_won: 'Сиз ютдингиз!', you_lost: 'Сиз ютқаздингиз',
    pts_plus: '+5 очко қўшилди', pts_minus: '−5 очко айирилди',
    you_l: '👤 Сиз', opp_l: '👤 Рақиб', home_l: 'Бош саҳифа',
    rematch: 'Қайта ўйнаш', tie_note: '* Тенг натижа — тезроқ тугаллаган ютди',
    joining: 'Ўйинга қўшилмоқда...', room_404: 'Хона топилмади',
    room_full: 'Бу хона тўла ёки мавжуд эмас', back_battle: 'Рақобатга қайтиш',
    wait_done: 'Рақиб тугашини кутмоқда...', q_l: 'Савол',
    // Modules
    videos_title: 'Видео дарсликлар',
    videos_sub_admin: 'Модулларни бошқаринг ва дарслар қўшинг',
    videos_sub_user: 'Модулни танланг ва ўрганишни бошланг',
    no_modules: 'Ҳозирча модул йўқ',
    lessons_l: 'Дарслар', add_lesson: '+ Дарс қўш', no_lessons: 'Ҳали дарс қўшилмаган',
    completed_pct: 'якунланган', lessons_count: 'дарс',
    btn_review: 'Қайта кўриш', btn_cont: 'Давом этиш',
  },
};
