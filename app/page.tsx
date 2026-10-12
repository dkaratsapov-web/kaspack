import { Hero } from '@/components/Hero';
import { Catalog } from '@/components/sections/Catalog';
import { Explode } from '@/components/sections/Explode';
import { Custom } from '@/components/sections/Custom';
import { Production } from '@/components/sections/Production';
import { Calculator } from '@/components/sections/Calculator';
import { Delivery } from '@/components/sections/Delivery';
import { Process } from '@/components/sections/Process';
import { Dealers } from '@/components/sections/Dealers';
import { Faq } from '@/components/sections/Faq';
import { Contacts } from '@/components/sections/Contacts';
import { RevealObserver } from '@/components/Reveal';
import { MobileBar } from '@/components/MobileBar';
import { BoneDrift } from '@/components/backgrounds/BoneDrift';

// Порядок блоков — бриф v1.2, «решения исполнителя».
export default function HomePage() {
  return (
    <>
      <Hero />
      <Catalog />
      <Explode />
      <Custom />
      <Production />
      <Delivery />
      {/* нижний светлый лист: расчёт, процесс, дилеры, вопросы, контакты */}
      <div className="chapter field-bone isolate overflow-hidden pt-4">
        <BoneDrift />
        <Calculator />
        <Process />
        <Dealers />
        <Faq />
        <Contacts />
      </div>
      <RevealObserver />
      <MobileBar />
    </>
  );
}
