'use client';

import { useEffect } from 'react';
import { advance, useThree } from '@react-three/fiber';
import { heroProgress } from '@/lib/heroProgress';

// Отдаёт canvas (frameloop="never") циклу сцены HeroCatalogStage: кадр рисуется сразу после того,
// как сцена записала прогресс и стили. when — рисовать ли этот кадр (стабильная функция).
export function StageDriver({ when }: { when?: () => boolean }) {
  const get = useThree((s) => s.get);

  useEffect(() => {
    const render = (seconds: number) => {
      if (!when || when()) advance(seconds, false, get());
    };
    heroProgress.renderers.add(render);
    return () => { heroProgress.renderers.delete(render); };
  }, [get, when]);

  return null;
}
