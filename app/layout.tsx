import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#162E56',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://opuscare.com.au'),
  title: 'Opus Care Support Services | NDIS Disability Support Yamba & Northern Rivers NSW',
  description: 'Compassionate, person-centred disability support for self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, Iluka, New Italy, and Northern Rivers NSW.',
  keywords: [
    'Opus Care Support Services',
    'Opus Care',
    'NDIS Yamba',
    'NDIS Grafton',
    'NDIS Maclean',
    'NDIS Northern Rivers',
    'Disability Support Worker Clarence Valley',
    'Plan Managed NDIS NSW',
    'Self Managed NDIS NSW',
    'Community Participation Northern Rivers',
    'Daily Living Support Clarence Coast'
  ],
  authors: [{ name: 'Opus Care Support Services' }],
  icons: {
    icon: [
      { url: '/brand/favicon.ico' },
      { url: '/brand/Opus_Care_Mark.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/brand/favicon.ico',
    apple: '/brand/Opus_Care_Mark.png',
  },
  openGraph: {
    title: 'Opus Care Support Services | Person-Centred NDIS Support',
    description: 'Practical, respectful disability support designed around your goals, routines and choices across Yamba, Grafton & Northern Rivers NSW.',
    siteName: 'Opus Care Support Services',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/brand/Opus_Care_Logo.jpg',
        width: 1024,
        height: 558,
        alt: 'Opus Care Support Services - Compassion. Empowerment. Independence.',
      },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/brand/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
