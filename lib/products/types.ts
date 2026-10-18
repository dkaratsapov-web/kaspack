// Шаблон страницы товара (programmatic-seo): у каждого товара свой файл с уникальным контентом,
// SEO-полями и набором полей формы. Общие только вёрстка и компоненты.
// Правило: в контент попадают только подтверждённые факты (бриф, решение 11); где цифр нет — формулируем качественно.

/** Поле гибкой формы заявки под товар. */
export type FormField =
  | { id: string; label: string; kind: 'chips'; options: string[]; multiple?: boolean; hint?: string }
  | { id: string; label: string; kind: 'number'; unit?: string; units?: string[]; placeholder?: string; hint?: string }
  | { id: string; label: string; kind: 'text' | 'textarea'; placeholder?: string; hint?: string };

export type ProductPage = {
  slug: string;
  seo: {
    /** <title>: формула старого сайта сохраняется (SEO-миграция), но может уточняться */
    title: string;
    /** уникальный description, до ~160 символов */
    description: string;
    /** основной и вспомогательные запросы — ориентир для текстов, в мета-теги не выводятся */
    keywords: string[];
  };
  hero: {
    h1: string;
    /** вторая строка заголовка: ключ «оптом от производителя» естественным языком */
    kicker: string;
    lead: string;
    facts: { value: string; label: string }[];
  };
  /** H2 разделов: свои формулировки под запросы каждого товара, без склейки из шаблона */
  headings: { types?: string; specs: string; uses: string; related: string; faq: string; final: string };
  form: {
    title: string;
    note: string;
    fields: FormField[];
  };
  /** виды товара: карточки «чем отличаются» */
  types?: { title: string; text: string; points: string[] }[];
  specs: { group: string; rows: [string, string][] }[];
  guide?: { title: string; intro: string; steps: { title: string; text: string }[] };
  uses: { title: string; text: string }[];
  /** «с этим берут»: перелинковка по сценарию отгрузки, а не по семейству */
  related: string[];
  faq: { q: string; a: string }[];
};
