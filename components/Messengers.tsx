import { company } from '@/lib/content';
import { MaxIcon } from './icons/MaxIcon';

// Мессенджеры в шапке и меню: WhatsApp, Telegram, MAX. Ссылки — только подтверждённые (lib/content).
// Пока ссылки нет, кнопка видна, но неактивна (aria-disabled) — не ведём клиента на чужой аккаунт.
const ITEMS = [
  {
    key: 'whatsapp', label: 'WhatsApp', href: company.whatsappHref, goal: 'wa_click', hover: 'hover:bg-[#25d366] hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.1 7.9c.3-.1.6 0 .7.3l.7 1.6c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.6.7c.3.1.4.4.3.7l-.3 1c-.2.5-.7.8-1.2.8-3.5-.3-6.3-3.1-6.6-6.6 0-.5.3-1 .8-1.2l.6-.2Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'telegram', label: 'Telegram', href: company.telegramHref, goal: 'tg_click', hover: 'hover:bg-[#229ed9] hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M20.6 4.3 3.5 11c-.8.3-.8 1.4 0 1.7l4.2 1.4 1.6 5c.2.7 1.1.9 1.6.4l2.4-2.3 4.3 3.1c.6.4 1.4.1 1.6-.6l2.8-13.2c.2-.8-.6-1.5-1.4-1.2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="m7.8 14 9-6.1-6.6 7.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'max', label: 'MAX', href: company.maxHref, goal: 'max_click', hover: 'hover:bg-[#5b3df5] hover:text-white',
    icon: <MaxIcon className="h-[22px] w-[22px]" />,
  },
] as const;

export function Messengers({ size = 'sm', tone = 'light', className = '' }: { size?: 'sm' | 'lg'; tone?: 'light' | 'dark'; className?: string }) {
  const box = size === 'lg' ? 'h-14 w-14' : 'h-10 w-10';
  // light — на светлом поле, dark — в графитовой капсуле шапки и в меню
  const base = tone === 'dark' ? 'bg-white/[0.07] text-bone' : 'bg-ink/[0.06] text-ink';
  const off = tone === 'dark' ? 'bg-white/[0.04] text-bone/35' : 'bg-ink/[0.06] text-ink/45';
  return (
    <ul className={`flex items-center gap-1.5 ${className}`} aria-label="Написать в мессенджер">
      {ITEMS.map((m) => (
        <li key={m.key}>
          {m.href ? (
            <a
              href={m.href} target="_blank" rel="noopener noreferrer" data-goal={m.goal}
              aria-label={`Написать в ${m.label}`} title={m.label}
              className={`grid ${box} place-items-center rounded-full transition-colors duration-200 ${base} ${m.hover}`}
            >
              {m.icon}
            </a>
          ) : (
            <span
              role="link" aria-disabled="true" aria-label={`${m.label}: ссылка скоро появится`} title={`${m.label}: ссылка скоро появится`}
              className={`grid ${box} cursor-default place-items-center rounded-full ${off}`}
            >
              {m.icon}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
