import './globals.css';
import LangProvider from '@/components/LangProvider';
export const metadata = { title: "Avtotest ta'lim platformasi" };
export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <head>
        <script dangerouslySetInnerHTML={{__html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})()`}} />
      </head>
      <body><LangProvider>{children}</LangProvider></body>
    </html>
  );
}
