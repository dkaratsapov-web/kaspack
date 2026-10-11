"""Собирает превью и спрайты вращения каталога из рендеров render-products.cjs.
python3 -I tools/build-sprites.py <renders_dir> <public/catalog> <frames>"""
import sys, glob, os
from PIL import Image

src, out, frames = sys.argv[1], sys.argv[2], int(sys.argv[3])
os.makedirs(out, exist_ok=True)
slugs = sorted({os.path.basename(f).rsplit('-', 1)[0] for f in glob.glob(os.path.join(src, '*-00.png'))})
for slug in slugs:
    first = Image.open(os.path.join(src, f'{slug}-00.png')).convert('RGBA')
    first.resize((480, 480), Image.LANCZOS).save(os.path.join(out, f'{slug}.webp'), quality=86, method=6)
    fs = sorted(glob.glob(os.path.join(src, f'{slug}-*.png')))
    if len(fs) >= frames:
        S = 320
        sheet = Image.new('RGBA', (S * frames, S), (0, 0, 0, 0))
        for i, f in enumerate(fs[:frames]):
            sheet.paste(Image.open(f).convert('RGBA').resize((S, S), Image.LANCZOS), (i * S, 0))
        sheet.save(os.path.join(out, f'{slug}-spin.webp'), quality=80, method=6)
    print('ok', slug)
