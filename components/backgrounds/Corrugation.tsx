import { asset } from '@/lib/env';

// Крафтовое поле «Под ваш груз»: фото среза многослойного гофрокартона (от заказчика) с лёгким параллаксом.
// Слева крафтовая подложка — список разделов читается; справа фото видно в полную силу.
export function Corrugation() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <img
        src={asset('/textures/corrugated-layers.webp')}
        srcSet={`${asset('/textures/corrugated-layers-960.webp')} 960w, ${asset('/textures/corrugated-layers.webp')} 1672w`}
        sizes="100vw"
        alt=""
        width={1672}
        height={941}
        loading="lazy"
        decoding="async"
        className="bg-parallax absolute inset-x-0 -inset-y-[10%] h-[120%] w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(198_156_109/0.86)_0%,rgb(198_156_109/0.62)_38%,rgb(198_156_109/0.12)_75%,rgb(198_156_109/0)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(198_156_109/0.35)_0%,transparent_30%,transparent_80%,rgb(42_31_20/0.18)_100%)]" />
    </div>
  );
}
