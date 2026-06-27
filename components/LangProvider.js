'use client';
import { LangProvider as LP } from '@/lib/lang';
export default function LangProvider({ children }) {
  return <LP>{children}</LP>;
}
