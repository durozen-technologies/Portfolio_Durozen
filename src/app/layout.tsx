import type { Metadata } from 'next';
import React from 'react';
import '../index.css';
import { AdminShortcutListener } from './AdminShortcutListener';

export const metadata: Metadata = {
  title: 'DUROZEN — Creative Project Portfolio',
  description:
    'A premium, minimal, interactive portfolio for DUROZEN featuring realistic gravity logo falling animation and immersive project reveal.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png',
  },
  openGraph: {
    title: 'DUROZEN — Creative Project Portfolio',
    description:
      'A premium, minimal, interactive portfolio for DUROZEN featuring realistic gravity logo falling animation and immersive project reveal.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Outfit:wght@300;400;500;600;700;800&family=Pacifico&family=Playball&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Satisfy&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
        <AdminShortcutListener />
        {children}
      </body>
    </html>
  );
}

