// Открытие поп-апа заявки из любого места сайта (кнопки вместо якорей #calc).
export type LeadDialogOptions = { source: string; title?: string; product?: string };

export function openLead(opts: LeadDialogOptions) {
  window.dispatchEvent(new CustomEvent<LeadDialogOptions>('kp:lead', { detail: opts }));
  (window as unknown as { ym?: (...a: unknown[]) => void }).ym?.(Number(process.env.NEXT_PUBLIC_YM_ID || 0), 'reachGoal', `cta_${opts.source}`);
}
