import { Hero } from '@/components/Hero';

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Следующие блоки (бриф 8.2): каталог → «Груз в разборе» → «Под ваш груз» → производство → калькулятор → доставка → ... */}
      <section id="catalog" className="h-[40vh]" aria-label="Каталог (в разработке)" />
      <section id="calc" className="h-[20vh]" aria-label="Калькулятор (в разработке)" />
    </>
  );
}
