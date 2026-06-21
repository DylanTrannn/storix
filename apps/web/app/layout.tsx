import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import '@storix/ui/globals.css';
import { Providers } from '@/providers';

const display = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const body = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'Storix',
    template: '%s | Storix',
  },
  description: 'Curated goods for modern living.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-body)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
