// Единый источник фактов о компании. Только подтверждённые данные (бриф: решение 11).
export const company = {
  name: 'Kaspack',
  legalName: 'ООО «Каспак»',
  tagline: 'Производство промышленной упаковки',
  phone: '+7 (800) 550-40-08',
  phoneHref: 'tel:+78005504008',
  whatsappHref: 'https://wa.me/78005504008',
  // ⚪ ссылки Telegram и MAX ждём от заказчика: пока null — кнопки показаны неактивными, без выдуманных аккаунтов
  telegramHref: null as string | null,
  maxHref: null as string | null,
  email: 'info@kaspack.ru',
  city: 'Тверь',
  address: 'Тверь, Старицкое шоссе, 15', // 🟡 по 2ГИС, сверить с заказчиком
  inn: '7735141770',
  ogrn: '1157746212370',
  since: 2015,
  hours: { days: 'Пн–Пт', from: 9, to: 18, tz: 'МСК' },
  responseMinutes: 15,
} as const;

export const nav = [
  { href: '/#catalog', label: 'Каталог' },
  { href: '/#production', label: 'Производство' },
  { href: '/#delivery', label: 'Доставка' },
  { href: '/partneram', label: 'Дилерам' },
  { href: '/#contacts', label: 'Контакты' },
] as const;

export const facts = [
  { value: '17', label: 'видов упаковки и тары' },
  { value: '6', label: 'направлений собственного производства' },
  { value: 'Свой', label: 'автопарк: доставка по всей России' },
  { value: `с ${company.since}`, label: 'года работаем с бизнесом' },
] as const;

export type Category = {
  slug: string;
  title: string;
  family: 'film' | 'paper' | 'wood' | 'supplies';
  spec: string;
  slugVerified: boolean;
};

/** Подтверждённые характеристики по категориям (из старого сайта). Пустые — заполнить с заказчиком. */
export const categoryDetails: Record<string, { lead: string; specs: [string, string][]; uses?: string[] }> = {
  'strejch-plenka': {
    lead: 'Стрейч-плёнка для ручной и машинной упаковки грузов на поддонах. Производим сами, из первичного и вторичного сырья.',
    specs: [['Ширина', '125–500 мм'], ['Толщина', '17–23 мкм'], ['Ручная', 'рулоны до 3 кг'], ['Машинная', 'для паллетоупаковщиков'], ['Сырьё', 'первичное или вторичное']],
    uses: ['Фиксация груза на поддоне', 'Защита от пыли и влаги', 'Групповая упаковка'],
  },
  'bopp-plenka': { lead: 'Биаксиально ориентированная полипропиленовая плёнка для пакетов и упаковки.', specs: [['Виды', 'прозрачная, перламутровая, металлизированная, перфорированная']] },
  'vozdushno-puzyrchataya-plenka': { lead: 'Воздушно-пузырчатая плёнка для защиты хрупких и ценных грузов при перевозке.', specs: [] },
  'plenki-pvd-pnd': { lead: 'Плёнки ПВД и ПНД для упаковки, укрытия и технических задач. Любой объём, доставка по России.', specs: [['Применение', 'укрывные, технические, пищевая упаковка']] },
  gofrokarton: { lead: 'Трёх- и пятислойный гофрокартон собственного производства.', specs: [['Слойность', '3 и 5 слоёв'], ['Марки', 'Т-21…Т-24'], ['Цвет', 'белый и бурый']] },
  gofrotara: { lead: 'Гофрокороба под размеры вашего товара: подберём марку картона под вес и габариты.', specs: [['Размер', 'под ваш товар'], ['Печать', 'логотип и маркировка']] },
  'kraft-bumaga': { lead: 'Крафт-бумага для упаковки, защиты поверхностей и производства мешков.', specs: [['Плотность', 'до 120 г/м²']] },
  'cheki-i-termocheki': { lead: 'Чековая и термочековая лента для касс и платёжных терминалов.', specs: [] },
  'poddony-borta-brus': {
    lead: 'Деревянные поддоны, борта и брус собственного производства. Делаем термообработку с клеймом IPPC для экспорта.',
    specs: [['Древесина', 'хвойные породы, берёза, осина'], ['Сорт', '1, 2 и 3'], ['Обработка', 'термообработка, клеймо IPPC/HT']],
  },
  'kabelnye-barabany': { lead: 'Деревянные кабельные барабаны для кабельных заводов и дистрибьюторов.', specs: [['Номера', '№ 10, 12, 14'], ['Поставка', 'в сборе или в разборе']] },
  'yashchiki-dlya-produktov': { lead: 'Деревянные ящики для овощей, фруктов и продуктов.', specs: [] },
  skotch: { lead: 'Упаковочный скотч для заклейки коробов и маркировки грузов.', specs: [['Виды', 'прозрачный, цветной, малярный, технический, армированный'], ['Печать', 'логотип заказчика']] },
  'strepping-lenta-i-peht-lenta-zashchitnye-ugolki': {
    lead: 'Полипропиленовая и ПЭТ-лента для обвязки грузов и защитные уголки.',
    specs: [['ПП-лента', 'ширина 5–19 мм, толщина 0,35–1 мм'], ['ПЭТ-лента', 'ширина 12–19 мм, толщина 0,6–1,12 мм'], ['Разрывная нагрузка', 'до ~1 т (ПЭТ)']],
  },
  'pakety-pvd-pnd-psd': { lead: 'Пакеты ПВД, ПНД и ПСД оптом от производителя для склада, торговли и производства.', specs: [] },
  setki: { lead: 'Упаковочные сетки для овощей, фруктов, игрушек, посуды и текстиля. Изготавливаем по требованиям заказчика.', specs: [] },
  perchatki: { lead: 'Хлопковые рабочие перчатки для склада и производства.', specs: [['Классы', 'эконом, стандарт, люкс'], ['Размер', '23 см']] },
  metizy: { lead: 'Метизы собственного производства: гвозди и крепёж для тары и поддонов.', specs: [] },
};

export const families = {
  film: 'Плёнки',
  paper: 'Картон и бумага',
  wood: 'Дерево',
  supplies: 'Расходники и метизы',
} as const;

export const categories: Category[] = [
  { slug: 'strejch-plenka', title: 'Стрейч-плёнка', family: 'film', spec: 'Ручная и машинная, 125–500 мм, 17–23 мкм', slugVerified: true },
  { slug: 'bopp-plenka', title: 'БОПП-плёнка', family: 'film', spec: 'Прозрачная, перламутровая, металлизированная', slugVerified: true },
  { slug: 'vozdushno-puzyrchataya-plenka', title: 'Воздушно-пузырчатая плёнка', family: 'film', spec: 'Защита хрупкого груза', slugVerified: true },
  { slug: 'plenki-pvd-pnd', title: 'Плёнки ПВД, ПНД', family: 'film', spec: 'Укрывные, технические, пищевые', slugVerified: true },
  { slug: 'gofrokarton', title: 'Гофрокартон', family: 'paper', spec: '3 и 5 слоёв, Т-21…Т-24, белый и бурый', slugVerified: true },
  { slug: 'gofrotara', title: 'Гофротара', family: 'paper', spec: 'Короба под размер вашего товара', slugVerified: false },
  { slug: 'kraft-bumaga', title: 'Крафт-бумага', family: 'paper', spec: 'Плотность до 120 г/м²', slugVerified: true },
  { slug: 'cheki-i-termocheki', title: 'Чеки и термочеки', family: 'paper', spec: 'Чековая лента для касс и терминалов', slugVerified: true },
  { slug: 'poddony-borta-brus', title: 'Поддоны, борта, брус', family: 'wood', spec: 'Хвоя, берёза, осина; термообработка IPPC', slugVerified: true },
  { slug: 'kabelnye-barabany', title: 'Кабельные барабаны', family: 'wood', spec: '№ 10, 12, 14; в сборе и в разборе', slugVerified: true },
  { slug: 'yashchiki-dlya-produktov', title: 'Ящики для продуктов', family: 'wood', spec: 'Тара для овощей и фруктов', slugVerified: false },
  { slug: 'skotch', title: 'Скотч', family: 'supplies', spec: 'Прозрачный, цветной, с вашим логотипом', slugVerified: true },
  { slug: 'strepping-lenta-i-peht-lenta-zashchitnye-ugolki', title: 'Стреппинг- и ПЭТ-лента, уголки', family: 'supplies', spec: 'ПП 5–19 мм, ПЭТ 12–19 мм', slugVerified: true },
  { slug: 'pakety-pvd-pnd-psd', title: 'Пакеты ПВД, ПНД, ПСД', family: 'supplies', spec: 'Для склада, торговли, производства', slugVerified: true },
  { slug: 'setki', title: 'Сетки упаковочные', family: 'supplies', spec: 'Для овощей, игрушек, текстиля', slugVerified: true },
  { slug: 'perchatki', title: 'Перчатки', family: 'supplies', spec: 'Хлопковые: эконом, стандарт, люкс', slugVerified: true },
  { slug: 'metizy', title: 'Метизы', family: 'supplies', spec: 'Собственное производство', slugVerified: false },
];

/** Рабочее ли сейчас время отдела продаж (МСК, UTC+3). Используется в подписи формы. */
export function salesStatus(now = new Date()) {
  const msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60_000);
  const day = msk.getDay(); // 0 — вс
  const h = msk.getHours() + msk.getMinutes() / 60;
  const workday = day >= 1 && day <= 5;
  if (workday && h >= company.hours.from && h < company.hours.to) {
    return { open: true, text: `Перезвоним за ${company.responseMinutes} минут` } as const;
  }
  let when: string;
  if (workday && h < company.hours.from) when = 'сегодня';
  else if (day >= 1 && day <= 4) when = 'завтра';
  else when = 'в понедельник'; // пятница вечером, суббота, воскресенье
  return { open: false, text: `Перезвоним ${when} с ${company.hours.from}:00 МСК` } as const;
}
