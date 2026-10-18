import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, categoryDetails, company, families } from '@/lib/content';
import { asset } from '@/lib/env';
import { LeadForm } from '@/components/LeadForm';
import { ProductTemplate } from '@/components/product/ProductTemplate';
import { getProductPage, type ProductPage } from '@/lib/products';

const SITE = 'https://kaspack.ru';

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = categories.find((x) => x.slug === slug);
  if (!c) return {};
  const page = getProductPage(slug);
  if (page) {
    return {
      title: page.seo.title,
      description: page.seo.description,
      alternates: { canonical: `/${slug}` },
      openGraph: { type: 'website', title: page.seo.title, description: page.seo.description, url: `/${slug}`, images: [{ url: `/catalog/${slug}.webp`, width: 480, height: 480, alt: page.hero.h1 }] },
    };
  }
  // формула title старого сайта сохранена (бриф, SEO-миграция)
  return {
    title: `${c.title} купить оптом от производителя в Твери — Kaspack`,
    description: `${categoryDetails[slug]?.lead ?? c.spec} Доставка своим транспортом по России. ${company.phone}.`,
    alternates: { canonical: `/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const page = getProductPage(slug);
  if (page) {
    return (
      <>
        <ProductJsonLd page={page} />
        <ProductTemplate page={page} category={c} />
      </>
    );
  }
  const d = categoryDetails[slug];
  const related = categories.filter((x) => x.family === c.family && x.slug !== slug).slice(0, 4);

  return (
    <>
      <section className="wrap pb-16 pt-8 md:pb-24">
        <nav aria-label="Хлебные крошки" className="text-[14px] text-ink-mute">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="hover:text-ink">Главная</Link> /</li>
            <li><Link href="/#catalog" className="hover:text-ink">Каталог</Link> /</li>
            <li aria-current="page" className="text-ink-soft">{c.title}</li>
          </ol>
        </nav>
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-[14px] font-semibold text-ink-soft">{families[c.family]}</p>
            <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.03em]">{c.title}</h1>
            <p className="mt-5 max-w-[48ch] text-[18px] text-ink-soft">{d?.lead ?? c.spec}</p>
            <div className="mt-8 max-w-[40rem]"><LeadForm source={`category_${slug}`} /></div>
          </div>
          <div className="lg:col-span-6">
            <img src={asset(`/catalog/${slug}.webp`)} alt={`${c.title}: 3D-визуализация`} width={480} height={480} className="mx-auto w-full max-w-[520px]" />
          </div>
        </div>
      </section>

      {d && d.specs.length > 0 && (
        <section aria-labelledby="specs-title" className="bg-surface">
          <div className="wrap grid gap-10 py-20 lg:grid-cols-12">
            <h2 id="specs-title" className="text-[clamp(1.5rem,2.4vw,2rem)] font-semibold tracking-[-0.02em] lg:col-span-4">Характеристики</h2>
            <dl className="divide-y divide-line border-y border-line lg:col-span-8">
              {d.specs.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
                  <dt className="text-ink-mute">{k}</dt>
                  <dd className="font-semibold tabular">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="rel-title" className="wrap py-20">
          <h2 id="rel-title" className="text-[clamp(1.5rem,2.4vw,2rem)] font-semibold tracking-[-0.02em]">С этим берут</h2>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/${r.slug}`} className="block rounded-[var(--radius-card)] bg-surface p-3 shadow-[0_1px_0_var(--color-line)]">
                  <img src={asset(`/catalog/${r.slug}.webp`)} alt="" width={480} height={480} loading="lazy" className="aspect-square w-full rounded-[12px] bg-canvas object-contain" />
                  <p className="px-1.5 pb-1.5 pt-3 font-display text-[15px] font-semibold">{r.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** JSON-LD (schema-markup): хлебные крошки, товар и вопросы — ровно то, что видно на странице.
 *  Product без offers: публичных цен нет, поэтому расширенного сниппета с ценой не будет, но тип и производитель понятны. */
function ProductJsonLd({ page }: { page: ProductPage }) {
  const url = `${SITE}/${page.slug}`;
  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${SITE}/#catalog` },
        { '@type': 'ListItem', position: 3, name: page.hero.h1, item: url },
      ],
    },
    {
      '@type': 'Product',
      name: page.hero.h1,
      description: page.hero.lead,
      image: `${SITE}/catalog/${page.slug}.webp`,
      url,
      brand: { '@type': 'Brand', name: company.name },
      manufacturer: { '@type': 'Organization', name: company.legalName, url: SITE },
      additionalProperty: page.specs.flatMap((g) => g.rows).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: page.faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />;
}
