import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarePoint Support Services | Person-Centred Disability Support',
  description: 'Person-centred disability support for self-managed and plan-managed NDIS participants across Sydney and NSW.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
