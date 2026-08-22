import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarePoint Support Services | NDIS Disability Support Sydney',
  description: 'Person-centred disability support for self-managed and plan-managed NDIS participants across Greater Sydney, NSW. Daily living, community participation, transport and life skills.',
  keywords: [
    'NDIS Sydney',
    'Disability Support Worker Sydney',
    'CarePoint Support Services',
    'Plan Managed NDIS',
    'Self Managed NDIS',
    'Community Participation Sydney',
    'Daily Living Support NSW'
  ],
  authors: [{ name: 'CarePoint Support Services' }],
  icons: {
    icon: '/carepoint-mark.svg',
    shortcut: '/carepoint-mark.svg',
    apple: '/carepoint-mark.svg',
  },
  openGraph: {
    title: 'CarePoint Support Services | Person-Centred NDIS Support',
    description: 'Practical, respectful disability support designed around your goals, routines and choices across Greater Sydney.',
    siteName: 'CarePoint Support Services',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/carepoint-mark.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
