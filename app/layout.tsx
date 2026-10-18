import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LeadDialog } from '@/components/LeadDialog';
import { Intro, introBootScript } from '@/components/Intro';
import { company } from '@/lib/content';

const unbounded = localFont({
  src: [
    { path: './fonts/unbounded-cyrillic-wght-normal.woff2', weight: '200 900' },
    { path: './fonts/unbounded-latin-wght-normal.woff2', weight: '200 900' },
  ],
  variable: '--font-unbounded',
  display: 'swap',
});
const onest = localFont({
  src: [
    { path: './fonts/onest-cyrillic-wght-normal.woff2', weight: '100 900' },
    { path: './fonts/onest-latin-wght-normal.woff2', weight: '100 900' },
  ],
  variable: '--font-onest',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kaspack.ru'),
  title: 'Kaspack — производство промышленной упаковки и тары в Твери',
  description:
    'Стрейч-плёнка, гофрокартон и гофротара, поддоны, кабельные барабаны, скотч, метизы и ещё 11 видов упаковки от производителя. Оптом и под заказ, доставка своим транспортом по России.',
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'Kaspack' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f3f4f1',
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.legalName,
  alternateName: company.name,
  url: 'https://kaspack.ru',
  telephone: company.phone,
  email: company.email,
  taxID: company.inn,
  address: { '@type': 'PostalAddress', addressLocality: company.city, addressCountry: 'RU' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${unbounded.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introBootScript }} />
      </head>
      <body>
        <Intro />
        <a href="#main" className="skip-link">К содержимому</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <LeadDialog />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
