import Link from 'next/link';
import type { Category } from '@/lib/content';
import { categories, company, families } from '@/lib/content';
import { asset } from '@/lib/env';
import type { ProductPage } from '@/lib/products';
import { LeadButton } from '@/components/LeadButton';
import { LeadForm } from '@/components/LeadForm';
import { Blueprint } from '@/components/backgrounds/Blueprint';
import { ChevronField } from '@/components/backgrounds/ChevronField';
import { ProductForm } from './ProductForm';
import { ProductViewer } from './ProductViewer';

/*
 * Типовая страница товара (docs/PRODUCT-PAGE.md). Порядок — путь решения B2B-закупщика:
 *   1. первый экран: что это, ключевые параметры, 3D-модель, звонок/заявка
 *   2. расчёт: гибкая форма с параметрами именно этого товара
 *   3. виды: чем отличаются (ручная / машинная и т. п.)
 *   4. характеристики: таблица группами
 *   5. как подобрать: экспертный текст — уникальный контент страницы (programmatic-seo)
 *   6. применение и «с этим берут»: перелинковка по сценарию отгрузки
 *   7. вопросы (FAQPage) и финальная заявка
 * Цветовые поля чередуются, как на главной: светлое → графит → светлое → лайм → светлое → графит.
 */
/** Размер H1 по самому длинному слову: «ТЕРМОЧЕКОВАЯ» и «ПУЗЫРЧАТАЯ» должны влезать в строку на телефоне. */
function h1Size(h1: string) {
  const longest = Math.max(...h1.split(/[\s-]+/).map((w) => w.length));
  if (longest >= 11) return 'text-[clamp(2.05rem,6vw,6.6rem)]';
  if (longest >= 10) return 'text-[clamp(2.35rem,6.8vw,7.4rem)]';
  if (longest >= 9) return 'text-[clamp(2.6rem,7vw,7.8rem)]';
  return 'text-[clamp(2.9rem,7.4vw,8.2rem)]';
}

export function ProductTemplate({ page, category }: { page: ProductPage; category: Category }) {
  const related = page.related.map((s) => categories.find((c) => c.slug === s)).filter(Boolean) as Category[];

  return (
    <>
      {/* 1. Первый экран */}
      <section aria-labelledby="product-title" className="field-bone grain relative isolate overflow-hidden">
        <div className="wrap grid gap-10 pb-20 pt-6 lg:grid-cols-12 lg:items-center lg:pb-28 lg:pt-10">
          <div className="min-w-0 lg:col-span-7">
            <nav aria-label="Хлебные крошки" className="text-[14px] text-ink-mute">
              <ol className="flex flex-wrap gap-2">
                <li><Link href="/" className="hover:text-ink">Главная</Link> /</li>
                <li><Link href="/#catalog" className="hover:text-ink">Каталог</Link> /</li>
                <li aria-current="page" className="text-ink-soft">{page.hero.h1}</li>
              </ol>
            </nav>
            <p className="mt-8 text-[14px] font-semibold text-ink-soft">{page.hero.eyebrow ?? `${families[category.family]} · своё производство в Твери`}</p>
            <h1 id="product-title" className="mt-3">
              <span className={`giant block leading-[1.02] ${h1Size(page.hero.h1)}`}>{page.hero.h1}</span>
              <span className="title mt-2 block text-[clamp(1.6rem,3vw,3rem)] text-ink-soft">{page.hero.kicker}</span>
            </h1>
            <p className="lead mt-6 max-w-[52ch] text-ink-soft">{page.hero.lead}</p>
            <dl className="mt-8 grid max-w-[44rem] grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
              {page.hero.facts.map((f) => (
                <div key={f.label}>
                  <dt className="sr-only">{f.label}</dt>
                  <dd>
                    <span className="block whitespace-nowrap font-display text-[clamp(1.4rem,2vw,2rem)] font-bold tabular tracking-[-0.04em]">{f.value}</span>
                    <span className="mt-1 block text-[14px] text-ink-mute">{f.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LeadButton source={`product_${page.slug}_hero`} product={page.hero.h1} title={`Рассчитать: ${page.hero.h1.toLowerCase()}`}>Рассчитать стоимость</LeadButton>
              <a href="#raschet" className="btn btn-ghost">Подобрать параметры</a>
              <a href={company.phoneHref} className="ml-1 font-semibold tabular" data-goal="tel_click">{company.phone}</a>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <div aria-hidden="true" className="absolute inset-[14%] rounded-full bg-lime/30 blur-3xl" />
            <ProductViewer slug={page.slug} title={page.hero.h1} />
          </div>
        </div>
      </section>

      {/* 2. Расчёт: гибкая форма под товар */}
      <section id="raschet" aria-labelledby="calc-title" className="chapter field-graphite on-dark relative isolate overflow-hidden">
        <Blueprint />
        <div className="wrap grid gap-10 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-5">
            <h2 id="calc-title" className="title text-[clamp(2rem,3.4vw,3.4rem)] text-white">{page.form.title}</h2>
            <p className="lead mt-5 max-w-[40ch] text-graphite-soft">{page.form.note}</p>
            <ul className="mt-8 grid gap-3 text-[16px] text-graphite-ink">
              <li className="flex gap-3"><Check />Ответ за {company.responseMinutes} минут в рабочее время</li>
              <li className="flex gap-3"><Check />Доставка своим автопарком по России</li>
              <li className="flex gap-3"><Check />Любой объём: от разовой закупки до регулярных поставок</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-[28px] bg-white p-5 text-ink shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)] md:p-8">
              <ProductForm product={page.hero.h1} source={`product_${page.slug}`} fields={page.form.fields} />
            </div>
          </div>
        </div>
      </section>

      {/* 3–4. Виды и характеристики */}
      <section aria-labelledby="types-title" className="chapter field-bone relative isolate">
        <div className="wrap py-20 lg:py-28">
          {page.types && (
            <>
              <h2 id="types-title" className="title max-w-[18ch] text-[clamp(2rem,3.4vw,3.4rem)]">{page.headings.types}</h2>
              <ul className={`mt-10 grid gap-4 md:grid-cols-2 ${page.types.length === 3 ? 'lg:grid-cols-3' : ''}`}>
                {page.types.map((t) => (
                  <li key={t.title} className="min-w-0 rounded-[28px] bg-surface p-6 shadow-[0_1px_0_var(--color-line)] md:p-9">
                    {/* hyphens: «Металлизированная» не распирает карточку на узком экране */}
                    <h3 className="hyphens-auto break-words font-display text-[clamp(1.4rem,2vw,1.9rem)] font-bold tracking-[-0.03em]">{t.title}</h3>
                    <p className="mt-3 max-w-[46ch] text-ink-soft">{t.text}</p>
                    <ul className="mt-6 grid gap-2.5">
                      {t.points.map((p) => <li key={p} className="flex gap-3 text-[16px]"><Check dark />{p}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className={`grid gap-10 lg:grid-cols-12 ${page.types ? 'mt-20 lg:mt-28' : ''}`}>
            <h2 id={page.types ? undefined : 'types-title'} className="title text-[clamp(1.8rem,2.8vw,2.8rem)] lg:col-span-4">
              {page.headings.specs}
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
              {page.specs.map((g) => (
                <div key={g.group}>
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{g.group}</h3>
                  <dl className="mt-3 divide-y divide-line border-y border-line">
                    {g.rows.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-6 py-3.5">
                        <dt className="text-ink-soft">{k}</dt>
                        <dd className="text-right font-semibold tabular">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Как подобрать */}
      {page.guide && (
        <section aria-labelledby="guide-title" className="chapter field-lime grain relative isolate overflow-hidden">
          <ChevronField />
          <div className="wrap relative grid gap-10 py-20 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:py-28">
            <div className="lg:col-span-4 lg:row-start-1">
              <h2 id="guide-title" className="title text-[clamp(2rem,3.4vw,3.4rem)] text-ink">{page.guide.title}</h2>
              <p className="lead mt-5 max-w-[34ch] text-ink/75">{page.guide.intro}</p>
            </div>
            <ol className="grid gap-4 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
              {page.guide.steps.map((s) => (
                <li key={s.title} className="rounded-[24px] bg-white/85 p-6 backdrop-blur md:p-8">
                  <h3 className="font-display text-[clamp(1.25rem,1.8vw,1.6rem)] font-bold tracking-[-0.03em]">{s.title}</h3>
                  <p className="mt-2 max-w-[60ch] text-ink-soft">{s.text}</p>
                </li>
              ))}
            </ol>
            {/* короткая форма рядом с советами: кто не хочет разбираться сам, оставляет телефон.
                На десктопе — под заголовком, на телефоне — после советов */}
            <div className="max-w-[30rem] self-start rounded-[24px] bg-white/85 p-4 text-ink backdrop-blur md:p-5 lg:col-span-4 lg:col-start-1 lg:row-start-2">
              <p className="px-1 font-display text-[clamp(1.2rem,1.6vw,1.45rem)] font-bold tracking-[-0.03em]">Поможем с подбором</p>
              <p className="mb-4 mt-1 px-1 text-[15px] text-ink-soft">Менеджер расспросит о грузе и предложит подходящий вариант.</p>
              <LeadForm source={`product_${page.slug}_guide`} layout="pair" product={page.hero.h1} cta="Помогите подобрать" />
            </div>
          </div>
        </section>
      )}

      {/* 6. Применение и «с этим берут» */}
      <section aria-labelledby="uses-title" className="chapter field-bone relative isolate">
        <div className="wrap py-20 lg:py-28">
          <h2 id="uses-title" className="title text-[clamp(2rem,3.4vw,3.4rem)]">{page.headings.uses}</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {page.uses.map((u) => (
              <li key={u.title} className="border-t-2 border-ink pt-5">
                <h3 className="font-display text-[clamp(1.2rem,1.6vw,1.5rem)] font-bold tracking-[-0.03em]">{u.title}</h3>
                <p className="mt-2 text-ink-soft">{u.text}</p>
              </li>
            ))}
          </ul>

          {related.length > 0 && (
            <div className="mt-20 lg:mt-28">
              <h2 className="title text-[clamp(1.8rem,2.8vw,2.8rem)]">{page.headings.related}</h2>
              <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/${r.slug}`} className="group block rounded-[24px] bg-surface p-3 shadow-[0_1px_0_var(--color-line)]" data-goal="category_open">
                      <img src={asset(`/catalog/${r.slug}.webp`)} alt="" width={480} height={480} loading="lazy" className="aspect-square w-full object-contain transition-transform duration-500 [transition-timing-function:var(--e-settle)] group-hover:-translate-y-1.5" />
                      <p className="px-2 pb-2 pt-3 font-display text-[16px] font-bold tracking-[-0.02em]">{r.title}</p>
                      <p className="px-2 pb-2 text-[14px] text-ink-mute">{r.spec}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 7. Вопросы */}
      <section aria-labelledby="pfaq-title" className="wrap pb-24 md:pb-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <h2 id="pfaq-title" className="title min-w-0 text-[clamp(2rem,3.2vw,3.4rem)] lg:col-span-4">{page.headings.faq}</h2>
          <div className="divide-y divide-line border-y border-line lg:col-span-8">
            {page.faq.map((x) => (
              <details key={x.q} className="faq group/faq">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-[17px] font-semibold tracking-[-0.01em]">
                  {x.q}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--color-line)]" aria-hidden="true">
                    <svg className="faq-chev h-2 w-3.5" viewBox="0 0 190 88"><polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" /></svg>
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 text-ink-soft">{x.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* финальная заявка */}
      <section aria-labelledby="final-title" className="chapter field-graphite on-dark relative isolate overflow-hidden">
        <Blueprint />
        <div className="wrap grid gap-10 py-20 lg:grid-cols-12 lg:items-center lg:py-24">
          <h2 id="final-title" className="title text-[clamp(2rem,3.4vw,3.4rem)] text-white lg:col-span-6">
            {page.headings.final}
          </h2>
          <div className="rounded-[20px] bg-white/95 p-3 md:p-4 lg:col-span-6">
            <LeadForm source={`product_${page.slug}_final`} product={page.hero.h1} />
          </div>
        </div>
      </section>
    </>
  );
}

function Check({ dark = false }: { dark?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 190 88" className={`mt-[0.45em] h-2.5 w-4 shrink-0 ${dark ? 'text-lime-ink' : 'text-lime'}`}>
      <polygon points="0,0 95,59 190,0 190,23 95,88 0,23" fill="currentColor" />
    </svg>
  );
}
