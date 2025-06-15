import type { Metadata } from 'next';
import { PT_Sans, Baloo_2 } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans', 
  display: 'swap',
});

const baloo2 = Baloo_2({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '700'],
  variable: '--font-baloo-2',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jhatpat Recipes',
  description: 'Generate delicious Indian recipes from ingredients you have!',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ptSans.variable} ${baloo2.variable} h-full`}>
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
