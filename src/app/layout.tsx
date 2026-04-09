import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ConvexClientProvider from '@/components/ConvexClientProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rawgrowth Portal',
  description: 'Your AI department command center',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
