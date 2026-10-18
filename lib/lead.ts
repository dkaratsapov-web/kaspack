import { leadEndpoint } from './env';

export function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}

export type Lead = {
  name: string; phone: string; consent: boolean; source: string; website?: string;
  products?: string[]; volume?: string; comment?: string;
  /** поля гибкой формы товара: [подпись, значение] */
  details?: [string, string][];
};

/** Отправка заявки. Без NEXT_PUBLIC_LEAD_ENDPOINT (превью на GitHub Pages) — демо без отправки. */
export async function submitLead(lead: Lead) {
  if (!leadEndpoint) {
    await new Promise((r) => setTimeout(r, 600));
    return;
  }
  const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')));
  const res = await fetch(leadEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...lead, page: location.pathname, utm }),
  });
  if (!res.ok) throw new Error(String(res.status));
  (window as unknown as { ym?: (...a: unknown[]) => void }).ym?.(Number(process.env.NEXT_PUBLIC_YM_ID || 0), 'reachGoal', 'lead_form_submit');
}
