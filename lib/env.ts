export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
/** Куда отправлять заявки. На VPS — /api/lead (отдельный сервис за nginx). Пусто — демо-режим (GitHub Pages). */
export const leadEndpoint = process.env.NEXT_PUBLIC_LEAD_ENDPOINT ?? '';
/** Путь к статическому файлу с учётом basePath (GitHub Pages). */
export const asset = (p: string) => `${basePath}${p}`;
