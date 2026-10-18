import type { ProductPage } from './types';
import { strejchPlenka } from './strejch-plenka';
import { streppingLenta } from './strepping-lenta';
import { boppPlenka } from './bopp-plenka';
import { vozdushnoPuzyrchatayaPlenka } from './vozdushno-puzyrchataya-plenka';
import { plenkiPvdPnd } from './plenki-pvd-pnd';
import { kraftBumaga } from './kraft-bumaga';
import { chekiITermocheki } from './cheki-i-termocheki';
import { gofrokarton } from './gofrokarton';
import { gofrotara } from './gofrotara';
import { poddonyBortaBrus } from './poddony-borta-brus';
import { kabelnyeBarabany } from './kabelnye-barabany';
import { yashchikiDlyaProduktov } from './yashchiki-dlya-produktov';
import { skotch } from './skotch';
import { paketyPvdPndPsd } from './pakety-pvd-pnd-psd';
import { setki } from './setki';
import { perchatki } from './perchatki';
import { metizy } from './metizy';

// Реестр страниц товаров: все 17 категорий. Категория без записи открылась бы упрощённым шаблоном.
const PAGES: Record<string, ProductPage> = {
  [strejchPlenka.slug]: strejchPlenka,
  [streppingLenta.slug]: streppingLenta,
  [boppPlenka.slug]: boppPlenka,
  [vozdushnoPuzyrchatayaPlenka.slug]: vozdushnoPuzyrchatayaPlenka,
  [plenkiPvdPnd.slug]: plenkiPvdPnd,
  [kraftBumaga.slug]: kraftBumaga,
  [chekiITermocheki.slug]: chekiITermocheki,
  [gofrokarton.slug]: gofrokarton,
  [gofrotara.slug]: gofrotara,
  [poddonyBortaBrus.slug]: poddonyBortaBrus,
  [kabelnyeBarabany.slug]: kabelnyeBarabany,
  [yashchikiDlyaProduktov.slug]: yashchikiDlyaProduktov,
  [skotch.slug]: skotch,
  [paketyPvdPndPsd.slug]: paketyPvdPndPsd,
  [setki.slug]: setki,
  [perchatki.slug]: perchatki,
  [metizy.slug]: metizy,
};

export const getProductPage = (slug: string): ProductPage | undefined => PAGES[slug];
export type { ProductPage, FormField } from './types';
