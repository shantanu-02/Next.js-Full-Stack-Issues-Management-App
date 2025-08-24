import './globals.css';
import type { Metadata } from 'next/metadata';
import { Inter } from 'next/font/google';
import { initDatabase } from '@/lib/database';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Issues Tracker - Full Stack Next.js App',
  description: 'A comprehensive issue tracking system built with Next.js',
};

// Initialize database on startup
initDatabase();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}