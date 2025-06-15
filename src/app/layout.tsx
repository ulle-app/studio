import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans', // CSS variable for the font
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fridge Feast',
  description: 'Generate recipes from ingredients in your fridge!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ptSans.variable} h-full`}>
      <head>
        {/* Google Font <link> elements are not needed when using next/font */}
      </head>
      <body className="font-body antialiased h-full flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
