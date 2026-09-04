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
  title: 'Opus Care Support Services | Regional NSW Disability Support',
  description: 'Person-centred disability support for self-managed and plan-managed NDIS participants across Yamba, Maclean, Grafton, Iluka, New Italy, and Northern Rivers NSW.',
  keywords: [
    'NDIS Yamba',
    'NDIS Grafton',
    'NDIS Maclean',
    'Disability Support Worker Northern Rivers',
    'Opus Care Support Services',
    'Plan Managed NDIS NSW',
    'Self Managed NDIS NSW',
    'Community Participation Clarence Valley',
    'Daily Living Support Clarence Coast'
  ],
  authors: [{ name: 'Opus Care Support Services' }],
  icons: {
    icon: [
      { url: '/brand/favicon.ico' },
      { url: '/opus-care-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/brand/favicon.ico',
    apple: '/opus-care-logo.svg',
  },
  openGraph: {
    title: 'Opus Care Support Services | Person-Centred NDIS Support',
    description: 'Practical, respectful disability support from Ballina through Grafton to Coffs Harbour and nearby regional NSW communities.',
    siteName: 'Opus Care Support Services',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/opus-care-logo.svg',
        width: 1254,
        height: 1254,
        alt: 'Opus Care Support Services - Compassion. Empowerment. Independence.',
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
