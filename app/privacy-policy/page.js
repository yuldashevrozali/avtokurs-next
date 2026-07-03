import Navbar from '@/components/Navbar';
import Link from 'next/link';

export const metadata = {
  title: "Maxfiylik siyosati — Avtotest",
  description: "avtoqoida sayti foydalanuvchilar ma'lumotlari va maxfiylik siyosati haqida ma'lumot.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Bosh sahifa
          </Link>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Maxfiylik siyosati
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Oxirgi yangilanish: 2026-yil 1-iyul
        </p>

        <Section title="1. Umumiy ma'lumot">
          <p>
            Ushbu maxfiylik siyosati <strong>Avtoqoida</strong> (avtoqoida) sayti foydalanuvchilarining
            shaxsiy ma'lumotlari qanday to'planishi, ishlatilishi va himoya qilinishi haqida ma'lumot beradi.
            Saytdan foydalanish orqali siz ushbu siyosatga rozilik bildirasiz.
          </p>
        </Section>

        <Section title="2. To'planadigan ma'lumotlar">
          <p>Saytdan foydalanish jarayonida quyidagi ma'lumotlar to'planishi mumkin:</p>
          <ul>
            <li>Ro'yxatdan o'tish paytida: ism, elektron pochta manzili</li>
            <li>Test natijalari va o'quv faoliyati (shaxsiy profilingizni yaxshilash uchun)</li>
            <li>Brauzer turi, IP-manzil, qurilma ma'lumotlari (statistika uchun)</li>
            <li>Cookie fayllar va shunga o'xshash texnologiyalar orqali to'planadigan ma'lumotlar</li>
          </ul>
        </Section>

        <Section title="3. Cookie fayllar">
          <p>
            Saytimiz Cookie fayllardan foydalanadi. Cookie — bu brauzeringizga saqlanadigan kichik matn fayli.
            Ular quyidagi maqsadlarda ishlatiladi:
          </p>
          <ul>
            <li>Tizimga kirish holatini saqlash (avtorizatsiya)</li>
            <li>Til va interfeys sozlamalarini eslab qolish</li>
            <li>Sayt faoliyati statistikasini to'plash (Google Analytics)</li>
            <li>Reklama ko'rsatish (Google AdSense)</li>
          </ul>
          <p>
            Brauzer sozlamalaringizdan Cookie fayllarni o'chirib qo'yishingiz mumkin,
            lekin bu saytning ayrim funksiyalari ishlamay qolishiga olib kelishi mumkin.
          </p>
        </Section>

        <Section title="4. Google AdSense va reklama">
          <p>
            Saytimizda <strong>Google AdSense</strong> xizmati orqali reklama ko'rsatilishi mumkin.
            Google va uning hamkorlari saytingizga tashrif buyuruvchilarning manfaatlariga qarab
            reklama ko'rsatish uchun Cookie fayllardan foydalanadi.
          </p>
          <p>
            Google tomonidan reklamani shaxsiylashtirishni quyidagi manzilda o'chirib qo'yishingiz mumkin:{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}>
              www.google.com/settings/ads
            </a>
          </p>
          <p>
            Google maxfiylik siyosati haqida ko'proq ma'lumot:{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}>
              policies.google.com/privacy
            </a>
          </p>
        </Section>

        <Section title="5. Google Analytics">
          <p>
            Saytimiz foydalanuvchilar faoliyatini tahlil qilish uchun <strong>Google Analytics</strong> xizmatidan foydalanadi.
            Bu xizmat saytga tashrif buyuruvchilar soni, sahifalar ko'rishlar, vaqt sarflash kabi
            anonim statistik ma'lumotlarni to'playdi.
          </p>
          <p>
            Google Analytics Cookie fayllardan foydalanishni to'xtatish uchun Google Analytics
            Opt-out Browser Add-on'ni o'rnating:{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}>
              tools.google.com/dlpage/gaoptout
            </a>
          </p>
        </Section>

        <Section title="6. Ma'lumotlardan foydalanish">
          <p>To'plangan ma'lumotlar quyidagi maqsadlarda ishlatiladi:</p>
          <ul>
            <li>Shaxsiy o'quv natijalarini saqlash va ko'rsatish</li>
            <li>Sayt ishlashini yaxshilash va texnik xatolarni bartaraf etish</li>
            <li>Foydalanuvchi tajribasini shaxsiylashtirilgan holda taqdim etish</li>
            <li>Sayt statistikasini tahlil qilish</li>
          </ul>
          <p>
            Shaxsiy ma'lumotlaringiz uchinchi shaxslarga sotilmaydi yoki ijaraga berilmaydi.
            Qonun talablari bundan mustasno.
          </p>
        </Section>

        <Section title="7. Ma'lumotlar xavfsizligi">
          <p>
            Foydalanuvchilar ma'lumotlarini himoya qilish uchun zamonaviy xavfsizlik texnologiyalari,
            jumladan HTTPS shifrlash va xavfsiz autentifikatsiya tizimlaridan foydalanamiz.
            Parollar shifrlanib saqlanadi.
          </p>
        </Section>

        <Section title="8. Foydalanuvchi huquqlari">
          <p>Siz quyidagi huquqlarga egasiz:</p>
          <ul>
            <li>O'zingiz haqingizda saqlangan ma'lumotlarni ko'rish va tahrirlash</li>
            <li>Hisobingizni va barcha ma'lumotlaringizni o'chirish</li>
            <li>Shaxsiylashtirilgan reklamani o'chirish</li>
            <li>Cookie fayllarni brauzer orqali boshqarish</li>
          </ul>
        </Section>

        <Section title="9. Uchinchi tomon havolalari">
          <p>
            Saytimizda uchinchi tomon saytlariga havolalar bo'lishi mumkin.
            Ushbu saytlarning maxfiylik siyosati uchun biz javobgar emasmiz.
          </p>
        </Section>

        <Section title="10. Siyosatdagi o'zgarishlar">
          <p>
            Biz ushbu maxfiylik siyosatini vaqti-vaqti bilan yangilab turamiz.
            Muhim o'zgarishlar sahifada e'lon qilinadi. Saytdan foydalanishni davom ettirishingiz
            yangilangan siyosatga rozilik bildirilganini anglatadi.
          </p>
        </Section>

        <Section title="11. Bog'lanish">
          <p>
            Maxfiylik siyosati bo'yicha savollaringiz bo'lsa, biz bilan bog'laning:
          </p>
          <p>
            📧 <a href="mailto:yuldashevrozalibek1@gmail.com" style={{ color: 'var(--primary)' }}>
              yuldashevrozalibek1@gmail.com
            </a>
          </p>
        </Section>

      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
