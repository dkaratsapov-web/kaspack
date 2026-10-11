import Link from 'next/link';
import { company, nav } from '@/lib/content';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="on-dark bg-[#181b21] text-graphite-ink">
      <div className="mx-auto grid max-w-[1360px] gap-10 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <Logo tone="light" />
          <p className="mt-5 max-w-[40ch] text-[15px] text-graphite-soft">
            Производство и поставка промышленной упаковки. Тверь, доставка по всей России.
          </p>
        </div>
        <nav aria-label="Навигация в подвале" className="md:col-span-3">
          <ul className="grid gap-2.5 text-[15px]">
            {nav.map((n) => <li key={n.href}><Link href={n.href} className="text-graphite-soft transition-colors hover:text-white">{n.label}</Link></li>)}
          </ul>
        </nav>
        <div className="grid content-start gap-2.5 text-[15px] md:col-span-4">
          <a href={company.phoneHref} className="font-display text-[20px] font-semibold text-white tabular">{company.phone}</a>
          <a href={`mailto:${company.email}`} className="text-graphite-soft hover:text-white">{company.email}</a>
          <p className="text-graphite-soft">{company.address}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-5 py-6 text-[13px] text-graphite-soft md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} {company.legalName} · ИНН {company.inn}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/politika-obrabotki-personalnyh-dannyh" className="hover:text-white">Политика обработки персональных данных</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
