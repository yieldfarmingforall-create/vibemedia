import React, { useEffect, useRef, useState } from 'react';

// Premium magnetic cursor: smooth-interpolated dot + trailing ring.
// Scales up over interactive elements. Only enabled on fine-pointer devices.
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    let hovering = false;
    let raf;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const t = e.target;
      hovering = !!(t.closest && t.closest('a, button, [role="button"], input, textarea, select, .cursor-target'));
    };

    const render = () => {
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        const s = hovering ? 2.2 : 1;
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${s})`;
        ringRef.current.style.opacity = hovering ? '1' : '0.6';
      }
      raf = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(render);
    document.documentElement.style.cursor = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      document.documentElement.style.cursor = '';
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 6, height: 6, borderRadius: '50%',
          background: '#FFC107', pointerEvents: 'none', zIndex: 100000,
          mixBlendMode: 'difference', willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 34, height: 34, borderRadius: '50%',
          border: '1px solid rgba(255,193,7,0.7)', pointerEvents: 'none', zIndex: 100000,
          transition: 'opacity 0.3s ease', willChange: 'transform', mixBlendMode: 'difference',
        }}
      />
    </>
  );
}