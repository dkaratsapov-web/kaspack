import type { MetadataRoute } from 'next';
import { categories } from '@/lib/content';

// sitemap.xml для боевого домена (programmatic-seo: все страницы товаров в карте сайта, без сирот)
const SITE = 'https://kaspack.ru';
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: 'weekly', priority: 1 },
    ...categories.map((c) => ({ url: `${SITE}/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${SITE}/partneram`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/politika-obrabotki-personalnyh-dannyh`, changeFrequency: 'yearly', priority: 0.1 },
  ];
}
