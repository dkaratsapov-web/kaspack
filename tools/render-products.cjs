// Рендер превью товаров из /render-lab: node tools/render-products.cjs <baseUrl> <outDir> [frames=1] [slug...]
const { chromium } = require('playwright');
const fs = require('fs');
const slugs = ['strejch-plenka','bopp-plenka','vozdushno-puzyrchataya-plenka','plenki-pvd-pnd','gofrokarton','gofrotara','kraft-bumaga','cheki-i-termocheki','poddony-borta-brus','kabelnye-barabany','yashchiki-dlya-produktov','skotch','strepping-lenta-i-peht-lenta-zashchitnye-ugolki','pakety-pvd-pnd-psd','setki','perchatki','metizy'];
(async () => {
  const [base, out, framesArg = '1', ...only] = process.argv.slice(2);
  const frames = Number(framesArg);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 640, height: 640 } });
  p.on('pageerror', (e) => console.error('ERR', e.message));
  for (const slug of only.length ? only : slugs) {
    let loaded = false;
    for (let f = 0; f < frames; f++) {
      const file = `${out}/${slug}-${String(f).padStart(2, '0')}.png`;
      if (fs.existsSync(file)) continue; // докатываем прерванный рендер
      const angle = (360 / frames) * f;
      const hasSetter = loaded && (await p.evaluate(() => typeof window.setAngle === 'function').catch(() => false));
      if (hasSetter) {
        await p.evaluate((a) => window.setAngle(a), angle);
        await p.waitForTimeout(250);
      } else {
        // страница перезагрузилась (HMR) или первый кадр — открываем сразу нужный ракурс
        await p.goto(`${base}/render-lab?slug=${slug}&angle=${angle}`, { waitUntil: 'networkidle' });
        await p.waitForTimeout(1800);
        loaded = true;
      }
      await p.locator('canvas').screenshot({ path: file, omitBackground: true, timeout: 120000 });
    }
    console.log('ok', slug);
  }
  await b.close();
})();
