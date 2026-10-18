# Контур России для карты доставки: python3 tools/russia-outline.py <ne_10m_admin_0_countries_rus.geojson> <out.json>
# Исходник: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_rus.geojson
# Затем out.json переносится в lib/geo/russia-outline.ts (d → RUSSIA_D, fit → FIT). Нужен shapely.
import json, math, sys
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
f = [f for f in d['features'] if f['properties'].get('ADM0_A3') == 'RUS'][0]
DEG = math.pi / 180
P1, P2, P0, L0 = 52*DEG, 64*DEG, 58*DEG, 90*DEG
n = math.log(math.cos(P1)/math.cos(P2)) / math.log(math.tan(math.pi/4+P2/2)/math.tan(math.pi/4+P1/2))
F = math.cos(P1)*math.tan(math.pi/4+P1/2)**n / n
rho = lambda lat: F / math.tan(math.pi/4 + lat*DEG/2)**n
RHO0 = rho(P0/DEG)
def proj(lon, lat):
    if lon < 0: lon += 360  # Чукотка за 180-м меридианом
    r = rho(lat); t = n*(lon*DEG - L0)
    return (r*math.sin(t), RHO0 - r*math.cos(t))
polys = [Polygon([proj(lo, la) for lo, la in p[0]]) for p in f['geometry']['coordinates']]
xs = [x for p in polys for x, _ in p.exterior.coords]; ys = [y for p in polys for _, y in p.exterior.coords]
minX, maxX, minY, maxY = min(xs), max(xs), min(ys), max(ys)
W, H, PAD = 1000, 520, 24
k = min((W-2*PAD)/(maxX-minX), (H-2*PAD)/(maxY-minY))
offX = (W-(maxX-minX)*k)/2; offY = (H-(maxY-minY)*k)/2
def view(p): return Polygon([(offX+(x-minX)*k, H-(offY+(y-minY)*k)) for x, y in p.exterior.coords])
# склейка по шву 180-го меридиана: части касаются — объединяем с крошечным буфером
merged = unary_union([view(p).buffer(0.05) for p in polys]).buffer(-0.05)
geoms = merged.geoms if isinstance(merged, MultiPolygon) else [merged]
parts = []
for g in sorted(geoms, key=lambda g: -g.area):
    if g.area < 6: continue
    s = g.simplify(0.55, preserve_topology=True)
    c = list(s.exterior.coords)[:-1]
    if len(c) < 4: continue
    parts.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in c) + 'Z')
path = ''.join(parts)
json.dump({'d': path, 'fit': {'minX': minX, 'minY': minY, 'k': k, 'offX': offX, 'offY': offY, 'W': W, 'H': H}}, open(out, 'w'))
print('parts', len(parts), 'chars', len(path))
