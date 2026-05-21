import { useEffect, useState } from 'react';

export function useCanvasScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const MOBILE_BREAKPOINT = 1100;

    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      // On mobile/tablet (≤1100px), disable canvas scaling entirely
      if (viewportWidth <= MOBILE_BREAKPOINT) {
        setScale(1);
        return;
      }
      const nextScale = Math.min(viewportWidth / 1512, 1);
      setScale(Number(nextScale.toFixed(4)));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
}
