import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/render-lab'] },
    sitemap: 'https://kaspack.ru/sitemap.xml',
    host: 'kaspack.ru',
  };
}
