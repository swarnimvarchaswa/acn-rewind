import type { Metadata } from 'next';
import { Montserrat, Lora } from 'next/font/google';
import './globals.css';
import { PHProvider } from './providers';

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ACN Wrap',
  description: 'Your year in review',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${lora.variable} ${montserrat.variable} antialiased bg-black flex justify-center items-center h-dvh w-screen overflow-hidden`}
      >
        <PHProvider>
          <div className="w-full h-full sm:max-w-[480px] sm:h-[96vh] sm:rounded-3xl shadow-2xl relative bg-black overflow-hidden">
            {children}
          </div>
        </PHProvider>
      </body>
    </html>
  );
}
