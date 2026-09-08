import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opuscare.com.au';
  const routes = [
    '',
    '/services',
    '/about',
    '/referral',
    '/contact',
    '/faq',
    '/privacy',
    '/complaints',
    '/incident-management',
    '/code-of-conduct',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : route === '/referral' || route === '/services' ? 0.9 : 0.8,
  }));
}
