import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// /mavzular va /biletlar ro'yxat sahifalari ochiq (Google bot uchun)
// faqat /mavzular/[id] va /biletlar/[id] login talab qiladi
const PROTECTED = [
  '/mavzular/',
  '/biletlar/',
  '/imtihon',
  '/modules',
  '/battle',
  '/marafon',
  '/saqlangan',
  '/xatolar',
  '/mashq/',
  '/admin',
  '/profile',
];

function isProtected(pathname) {
  return PROTECTED.some(p => pathname.startsWith(p) || pathname === p);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get('avtokurs_token')?.value;
  if (!token) return redirectLogin(request);

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const res = redirectLogin(request);
    res.cookies.delete('avtokurs_token');
    return res;
  }
}

function redirectLogin(request) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/mavzular/:path+',
    '/biletlar/:path+',
    '/imtihon/:path*',
    '/modules/:path*',
    '/battle/:path*',
    '/marafon/:path*',
    '/saqlangan/:path*',
    '/xatolar/:path*',
    '/mashq/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ],
};
