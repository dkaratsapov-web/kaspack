import type { ProductPage } from './types';
import { strejchPlenka } from './strejch-plenka';
import { streppingLenta } from './strepping-lenta';

// Реестр страниц товаров. Пока страницы нет в реестре, категория открывается упрощённым шаблоном.
const PAGES: Record<string, ProductPage> = {
  [strejchPlenka.slug]: strejchPlenka,
  [streppingLenta.slug]: streppingLenta,
};

export const getProductPage = (slug: string): ProductPage | undefined => PAGES[slug];
export type { ProductPage, FormField } from './types';
