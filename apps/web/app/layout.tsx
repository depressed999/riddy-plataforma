import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import 'geist/font/sans';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { configuredSiteUrl } from '@/lib/site-url';

const siteUrl = configuredSiteUrl();

export const metadata: Metadata = {
  applicationName: 'Riddy',
  description:
    'Alugue carros e motos de pessoas verificadas com praticidade e segurança.',
  formatDetection: { address: false, email: false, telephone: false },
  metadataBase: new URL(siteUrl),
  openGraph: {
    description:
      'Alugue carros e motos de pessoas verificadas com praticidade e segurança.',
    locale: 'pt_BR',
    siteName: 'Riddy',
    title: 'Riddy | Mobilidade entre pessoas',
    type: 'website',
    url: '/',
  },
  robots: { follow: true, index: true },
  title: 'Riddy | Mobilidade entre pessoas',
  twitter: {
    card: 'summary',
    description:
      'Alugue carros e motos de pessoas verificadas com praticidade e segurança.',
    title: 'Riddy | Mobilidade entre pessoas',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  initialScale: 1,
  themeColor: '#f7f9fb',
  width: 'device-width',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
