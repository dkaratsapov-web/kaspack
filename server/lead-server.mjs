#!/usr/bin/env node
// Приём заявок с сайта Kaspack (VPS в РФ, 152-ФЗ). Без зависимостей, кроме nodemailer для почты.
// POST /api/lead  → Telegram + amoCRM + письмо на info@kaspack.ru. Запуск за nginx (см. deploy/).
// Переменные окружения: см. deploy/lead.env.example
import http from 'node:http';

const env = process.env;
const PORT = Number(env.LEAD_PORT || 3001);
const MAX_BODY = 16 * 1024;
const hits = new Map(); // ip → [timestamps]

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8; // не больше 8 заявок за 10 минут с одного IP
}

const clean = (v, max = 300) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

function validate(b) {
  const lead = {
    name: clean(b.name, 80),
    phone: clean(b.phone, 20),
    source: clean(b.source, 60),
    page: clean(b.page, 200),
    volume: clean(b.volume, 300),
    products: Array.isArray(b.products) ? b.products.slice(0, 20).map((p) => clean(p, 80)) : [],
    utm: b.utm && typeof b.utm === 'object' ? Object.fromEntries(Object.entries(b.utm).slice(0, 6).map(([k, v]) => [clean(k, 30), clean(v, 120)])) : {},
  };
  if (b.consent !== true) return { error: 'consent' };
  if (lead.name.length < 2) return { error: 'name' };
  if (!/^\+7\d{10}$/.test(lead.phone)) return { error: 'phone' };
  return { lead };
}

function text(lead) {
  return [
    `Заявка с сайта (${lead.source || 'форма'})`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.products.length ? `Товары: ${lead.products.join(', ')}` : '',
    lead.volume ? `Объём: ${lead.volume}` : '',
    `Страница: ${lead.page || '/'}`,
    Object.keys(lead.utm).length ? `UTM: ${Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(' ')}` : '',
  ].filter(Boolean).join('\n');
}

async function toTelegram(lead) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return 'skip';
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: text(lead), disable_web_page_preview: true }),
  });
  if (!r.ok) throw new Error(`telegram ${r.status}`);
  return 'ok';
}

async function toAmo(lead) {
  if (!env.AMO_DOMAIN || !env.AMO_TOKEN) return 'skip';
  const payload = [{
    name: `Сайт: ${lead.products.length ? lead.products.slice(0, 3).join(', ') : 'заявка'}`,
    ...(env.AMO_PIPELINE_ID ? { pipeline_id: Number(env.AMO_PIPELINE_ID) } : {}),
    _embedded: {
      contacts: [{ first_name: lead.name, custom_fields_values: [{ field_code: 'PHONE', values: [{ value: lead.phone, enum_code: 'WORK' }] }] }],
      tags: [{ name: 'сайт' }, { name: lead.source || 'форма' }],
    },
  }];
  const r = await fetch(`https://${env.AMO_DOMAIN}/api/v4/leads/complex`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.AMO_TOKEN}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`amo ${r.status}`);
  const [created] = await r.json();
  if (created?.id) {
    // примечание к сделке с деталями заявки
    await fetch(`https://${env.AMO_DOMAIN}/api/v4/leads/${created.id}/notes`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.AMO_TOKEN}` },
      body: JSON.stringify([{ note_type: 'common', params: { text: text(lead) } }]),
    }).catch(() => {});
  }
  return 'ok';
}

async function toEmail(lead) {
  if (!env.SMTP_HOST || !env.LEAD_EMAIL_TO) return 'skip';
  const { default: nodemailer } = await import('nodemailer');
  const t = nodemailer.createTransport({
    host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 465), secure: env.SMTP_SECURE !== 'false',
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  await t.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, to: env.LEAD_EMAIL_TO, subject: `Заявка с сайта: ${lead.name}`, text: text(lead) });
  return 'ok';
}

const server = http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST' || req.url !== '/api/lead') return send(404, { ok: false });
  const origin = req.headers.origin;
  if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) return send(403, { ok: false });
  const ip = String(req.headers['x-real-ip'] || req.socket.remoteAddress || '');
  if (rateLimited(ip)) return send(429, { ok: false });

  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > MAX_BODY) return send(413, { ok: false }); }
  let body;
  try { body = JSON.parse(raw); } catch { return send(400, { ok: false }); }
  if (body.website) return send(200, { ok: true }); // honeypot: бот получает «успех», заявка не сохраняется

  const { lead, error } = validate(body);
  if (error) return send(422, { ok: false, error });

  const results = await Promise.allSettled([toTelegram(lead), toAmo(lead), toEmail(lead)]);
  const delivered = results.some((r) => r.status === 'fulfilled' && r.value === 'ok');
  // в лог — только статусы каналов, без персональных данных
  console.log(new Date().toISOString(), lead.source, results.map((r) => (r.status === 'fulfilled' ? r.value : `fail:${r.reason?.message}`)).join(','));
  return delivered ? send(200, { ok: true }) : send(502, { ok: false });
});

server.listen(PORT, '127.0.0.1', () => console.log(`lead-server на 127.0.0.1:${PORT}`));
