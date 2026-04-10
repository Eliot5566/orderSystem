import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Order System',
  description: 'Production-ready mobile ordering system MVP'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
