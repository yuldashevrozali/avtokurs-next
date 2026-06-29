import './globals.css';
import LangProvider from '@/components/LangProvider';
import MobileNav from '@/components/MobileNav';
export const metadata = {
  title: "Avtotest — Haydovchilik imtihoniga onlayn tayyorlanish",
  description: "Haydovchilik guvohnomasi olish uchun onlayn test ishlang. Yo'l harakati qoidalari bo'yicha 1200+ savol, biletlar, imtihon simulatsiyasi. Bepul tayyorlaning!",
  keywords: [
    "avtoqoida", "avtoqoida uz", "avtotest", "avto test",
    "haydovchilik guvohnomasi", "haydovchilik imtihoni",
    "prava", "pravaga tayyorlanish", "prava olish",
    "pravaga tayyorlanish online", "prava testlar",
    "yo'l harakati qoidalari", "YHQ", "YHQ testlar",
    "PDD testy", "PDD uzbekistan", "pdd uz",
    "haydovchilik testlari", "haydovchilik kurslari online",
    "avtotest online", "online test haydovchilik",
    "bilet imtihon", "yo'l belgilari", "avto biletlar",
    "haydovchilik maktabi", "avtomaktab",
  ].join(", "),
  openGraph: {
    title: "Avtotest — Haydovchilik imtihoniga onlayn tayyorlanish",
    description: "1200+ savol, biletlar va imtihon simulatsiyasi bilan haydovchilik guvohnomangizni oling!",
    type: "website",
    locale: "uz_UZ",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{__html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');var f=parseInt(localStorage.getItem('font-size'));if(f>=14&&f<=20)document.documentElement.style.fontSize=f+'px';})()`}} />
      </head>
      <body>
        <LangProvider>
          {children}
          <MobileNav />
        </LangProvider>
      </body>
    </html>
  );
}
