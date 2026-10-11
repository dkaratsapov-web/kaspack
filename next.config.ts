import type { NextConfig } from 'next';

// Статический экспорт: одна сборка для GitHub Pages (превью) и VPS в РФ (прод).
// На Pages сайт живёт в подпапке репозитория → NEXT_PUBLIC_BASE_PATH=/kaspack.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  // служебная рендер-лаборатория (app/render-lab/page.lab.tsx) собирается только при RENDER_LAB=1
  pageExtensions: process.env.RENDER_LAB ? ['lab.tsx', 'tsx', 'ts'] : ['tsx', 'ts'],
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: false,
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
