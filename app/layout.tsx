import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0E3D3A',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://carepointsupport.com.au'),
  title: 'CarePoint Support Services | NDIS Disability Support Yamba & Northern Rivers NSW',
  description: 'Person-centred disability support for self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, Iluka, New Italy, and Northern Rivers NSW.',
  keywords: [
    'NDIS Yamba',
    'NDIS Grafton',
    'NDIS Maclean',
    'Disability Support Worker Northern Rivers',
    'CarePoint Support Services',
    'Plan Managed NDIS NSW',
    'Self Managed NDIS NSW',
    'Community Participation Clarence Valley',
    'Daily Living Support Clarence Coast'
  ],
  authors: [{ name: 'CarePoint Support Services' }],
  icons: {
    icon: [
      { url: '/brand/favicon.ico' },
      { url: '/brand/CarePoint_Mark_512x512_Transparent.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/brand/favicon.ico',
    apple: '/brand/CarePoint_Logo_192x192.png',
  },
  openGraph: {
    title: 'CarePoint Support Services | Person-Centred NDIS Support',
    description: 'Practical, respectful disability support designed around your goals, routines and choices across Greater Sydney.',
    siteName: 'CarePoint Support Services',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/brand/CarePoint_Logo_Master.png',
        width: 1254,
        height: 1254,
        alt: 'CarePoint Support Services - Compassion. Empowerment. Independence.',
      },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
