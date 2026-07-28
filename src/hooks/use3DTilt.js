import { useRef, useCallback } from 'react';

export default function use3DTilt({
  maxDeg = 14,
  glowColor = 'rgba(255,193,7,0.25)',
  scale = 1.03,
} = {}) {
  const ref = useRef(null);

  const onMouseMove = useCallback((event) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotX = -y * maxDeg;
    const rotY = x * maxDeg;
    element.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    element.style.boxShadow = `${rotY * -1.5}px ${rotX * 1.5}px 40px ${glowColor}`;
  }, [glowColor, maxDeg, scale]);

  const onMouseLeave = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    element.style.boxShadow = 'none';
  }, []);

  return {
    ref,
    onMouseMove,
    onMouseLeave,
    tiltStyle: {
      transformStyle: 'preserve-3d',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      willChange: 'transform',
    },
  };
}