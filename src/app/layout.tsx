import type { Metadata, Viewport } from 'next';
import './globals.css';
import { APP_NAME, APP_LANG, APP_CLAIM } from '@/lib/moses';

export const metadata: Metadata = {
  title: { default: `${APP_NAME} – Wochenkontrolle`, template: `%s · ${APP_NAME}` },
  description: APP_CLAIM,
  applicationName: APP_NAME,
  // Personendaten gehoeren in keinen Suchindex.
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
  referrer: 'no-referrer',
  formatDetection: { telephone: false, email: false, address: false },
  other: { 'moses:langform': APP_LANG },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f1e3' },
    { media: '(prefers-color-scheme: dark)', color: '#111110' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
